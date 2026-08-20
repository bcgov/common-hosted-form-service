import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  nextMarkerIndex,
  readDeclarationBlock,
  extractBlocks,
  parseDeclarations,
  shouldSkipVariable,
  filterAndOverrideVariables,
  extractThemeVariables,
  buildHostThemeCss,
} from '~/embed/themeExtractor';

describe('themeExtractor', () => {
  let fixtureCss;

  beforeAll(() => {
    const fixturePath = path.resolve(
      __dirname,
      '../../fixtures/chefs-index.fixture.css'
    );
    fixtureCss = fs.readFileSync(fixturePath, 'utf8');
  });

  describe('utility functions', () => {
    it('nextMarkerIndex picks earliest of :root or [data-bs-theme', () => {
      const text = 'x :root { } something [data-bs-theme=light]{ }';
      expect(nextMarkerIndex(text, 0)).toBe(text.indexOf(':root'));
      const afterRoot = nextMarkerIndex(text, text.indexOf(':root') + 1);
      expect(afterRoot).toBe(text.indexOf('[data-bs-theme'));
    });

    it('nextMarkerIndex handles end of string correctly', () => {
      const text = 'no markers here';
      expect(nextMarkerIndex(text, 0)).toBe(-1);
    });

    it('readDeclarationBlock returns block and end index', () => {
      const text = ':root{ a:1; { b:2; } c:3; } .x{ y:2 }';
      const open = text.indexOf('{');
      const { block, endIndex } = readDeclarationBlock(text, open);
      expect(block).toContain('a:1');
      expect(block).toContain('c:3');
      expect(endIndex).toBeGreaterThan(open);
      expect(text.charAt(endIndex)).toBe('}');
    });

    it('readDeclarationBlock handles nested braces', () => {
      const text = ':root{ --var: url("data:image/svg+xml,<svg>{}</svg>"); }';
      const open = text.indexOf('{');
      const { block } = readDeclarationBlock(text, open);
      expect(block).toContain('--var');
      expect(block).toContain('svg>');
    });
  });

  describe('block extraction', () => {
    it('extractBlocks gets declaration blocks for :root and [data-bs-theme="light"] only', () => {
      const blocks = extractBlocks(fixtureCss);
      // Should include blocks: :root (multiple) and [data-bs-theme="light"] only
      expect(blocks.length).toBeGreaterThanOrEqual(3);
      const concatenated = blocks.join('\n');
      expect(concatenated).toContain('--bs-border-radius');
      expect(concatenated).toContain('--bs-body-color');
      expect(concatenated).toContain('--bs-tertiary-bg');
      // Should NOT contain dark theme or custom theme variables
      expect(concatenated).not.toContain('--bs-custom-var');
      expect(concatenated).not.toContain('--x-dark');
    });

    it('extractBlocks ignores non-relevant selectors', () => {
      const blocks = extractBlocks(fixtureCss);
      const concatenated = blocks.join('\n');
      // Should not include content from .btn, .form-control, etc.
      expect(concatenated).not.toContain('border-radius: var(');
      expect(concatenated).not.toContain('color: red');
    });
  });

  describe('declaration parsing', () => {
    it('parseDeclarations extracts CSS custom properties', () => {
      const block = '--bs-border-radius: .375rem; --x:1; color:red; --y: 2';
      const vars = parseDeclarations(block);
      expect(vars.get('--bs-border-radius')).toBe('.375rem');
      expect(vars.get('--x')).toBe('1');
      expect(vars.get('--y')).toBe('2');
      expect(vars.has('color')).toBe(false);
    });

    it('parseDeclarations handles complex values', () => {
      const block =
        '--complex: url("data:image/svg+xml,<svg>test</svg>"); --simple: #fff;';
      const vars = parseDeclarations(block);
      expect(vars.get('--complex')).toContain('svg>test</svg>');
      expect(vars.get('--simple')).toBe('#fff');
    });
  });

  describe('variable filtering', () => {
    it('shouldSkipVariable filters dark theme variables', () => {
      expect(shouldSkipVariable('--v-theme-dark', '#000')).toBe(true);
      expect(shouldSkipVariable('--v-theme-dark-surface', '#121212')).toBe(
        true
      );
      expect(shouldSkipVariable('--x-dark', '#111111')).toBe(true);
    });

    it('shouldSkipVariable filters surface-variant variables', () => {
      expect(shouldSkipVariable('--v-theme-surface-variant', '#1e1e1e')).toBe(
        true
      );
      expect(shouldSkipVariable('--surface-variant-color', '#333333')).toBe(
        true
      );
    });

    it('shouldSkipVariable filters #212529 backgrounds', () => {
      expect(shouldSkipVariable('--v-theme-background', '#212529')).toBe(true);
      expect(shouldSkipVariable('--bg-foo', '#212529')).toBe(true);
      expect(shouldSkipVariable('--another-bg', '#212529')).toBe(true);
    });

    it('shouldSkipVariable keeps valid variables', () => {
      expect(shouldSkipVariable('--bs-primary', '#0d6efd')).toBe(false);
      expect(shouldSkipVariable('--v-theme-surface', '#ffffff')).toBe(false);
      expect(shouldSkipVariable('--valid-custom', '#ff0000')).toBe(false);
    });

    it('filterAndOverrideVariables overrides specific variables', () => {
      const input = new Map([
        ['--bs-body-bg', '#000'],
        ['--v-theme-on-background', '#eee'],
        ['--v-theme-background', '#000'],
        ['--keep', '42'],
        ['--bs-primary', '#0d6efd'],
      ]);
      const out = filterAndOverrideVariables(input);
      expect(out.get('--bs-body-bg')).toBe('#fff');
      expect(out.get('--v-theme-on-background')).toBe('#212529');
      expect(out.get('--v-theme-background')).toBe('#fff');
      expect(out.get('--keep')).toBe('42');
      expect(out.get('--bs-primary')).toBe('#0d6efd');
    });
  });

  describe('full extraction and CSS generation', () => {
    it('extractThemeVariables returns variables from fixture CSS', () => {
      const result = extractThemeVariables(fixtureCss);
      expect(result.count).toBeGreaterThan(10);

      // Check that variables from :root are extracted
      expect(result.variables['--bs-border-radius']).toBe('0.375rem');
      expect(result.variables['--bs-primary']).toBe('#0d6efd');

      // Check that light theme overrides work
      expect(result.variables['--bs-body-color']).toBe('#212529'); // from [data-bs-theme=light]
      expect(result.variables['--bs-tertiary-bg']).toBe('#f8f9fa'); // light theme value, not dark
      expect(result.variables['--bs-tertiary-color']).toBe('#6c757d');

      // Check that custom theme variables are NOT included (only light theme extracted)
      expect(result.variables['--bs-custom-var']).toBeUndefined();

      // Check that dark theme variables are completely ignored (not extracted at all)
      expect(result.variables['--x-dark']).toBeUndefined();
      expect(result.variables['--v-theme-surface-variant']).toBeUndefined();
      expect(result.variables['--v-theme-dark-surface']).toBeUndefined();

      // Check that #212529 backgrounds are filtered
      expect(result.variables['--another-bg']).toBeUndefined();

      // Check forced overrides
      expect(result.variables['--bs-body-bg']).toBe('#fff');
      expect(result.variables['--v-theme-background']).toBe('#fff');
      expect(result.variables['--v-theme-on-background']).toBe('#212529');
    });

    it('buildHostThemeCss emits :host scoped CSS with variables', () => {
      const result = extractThemeVariables(fixtureCss);
      const css = buildHostThemeCss(result.variables);

      expect(css.startsWith('/* CHEFS theme variables')).toBe(true);
      expect(css).toContain(':host {');
      expect(css).toContain('--bs-border-radius: 0.375rem;');
      expect(css).toContain('--bs-primary: #0d6efd;');
      expect(css).toContain('--bs-body-bg: #fff;');
    });

    it('buildHostThemeCss includes comprehensive Shadow DOM compatibility fixes', () => {
      const result = extractThemeVariables(fixtureCss);
      const css = buildHostThemeCss(result.variables);

      // Check main compatibility comment
      expect(css).toContain('/* Shadow DOM compatibility fixes */');

      // Check :host styles
      expect(css).toContain(':host {');
      expect(css).toContain('box-sizing: border-box;');
      expect(css).toContain('-webkit-text-size-adjust: 100%;');
      expect(css).toContain('-webkit-font-smoothing: antialiased;');
      expect(css).toContain('-moz-osx-font-smoothing: grayscale;');
      expect(css).toContain('text-rendering: optimizeLegibility;');
      expect(css).toContain('-moz-tab-size: 4;');
      expect(css).toContain('tab-size: 4;');
      expect(css).toContain('word-break: normal;');

      // Check universal selector styles
      expect(css).toContain('*, *::before, *::after {');
      expect(css).toContain('box-sizing: inherit;');
      expect(css).toContain('background-repeat: no-repeat;');

      // Check reset styles
      expect(css).toContain('* {');
      expect(css).toContain('padding: 0;');
      expect(css).toContain('margin: 0;');
    });

    it('buildHostThemeCss creates valid CSS structure', () => {
      const result = extractThemeVariables(fixtureCss);
      const css = buildHostThemeCss(result.variables);

      // Should have proper CSS structure - there are actually 2 :host blocks (variables + shadow DOM fixes)
      const hostBlocks = css.match(/:host\s*{[^}]*}/g);
      expect(hostBlocks).toHaveLength(2); // Variables block + Shadow DOM fixes block

      // Should have universal selector block
      expect(css).toMatch(/\*,\s*\*::before,\s*\*::after\s*{[^}]*}/);

      // Should have reset block
      expect(css).toMatch(/\*\s*{[^}]*padding:\s*0[^}]*}/);
    });
  });

  describe('edge cases and robustness', () => {
    it('handles empty CSS input', () => {
      const result = extractThemeVariables('');
      expect(result.count).toBe(0);
      expect(Object.keys(result.variables)).toHaveLength(0);
    });

    it('handles CSS with no relevant blocks', () => {
      const css = '.foo { color: red; } .bar { background: blue; }';
      const result = extractThemeVariables(css);
      expect(result.count).toBe(0);
      expect(Object.keys(result.variables)).toHaveLength(0);
    });

    it('handles malformed CSS gracefully', () => {
      const css =
        ':root { --var: incomplete; } [data-bs-theme=light] { --other: value; }';
      const result = extractThemeVariables(css);
      // Should still extract what it can
      expect(result.variables['--var']).toBe('incomplete');
      expect(result.variables['--other']).toBe('value');
    });
  });
});
