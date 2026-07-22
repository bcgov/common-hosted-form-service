// Pure CSS theme extraction utilities for the embed viewer.
// No filesystem or environment access – suitable for unit testing.

function nextMarkerIndex(text, fromIndex) {
  // Use regex to find :root or [data-bs-theme=light] with any quote style
  const rootIndex = text.indexOf(':root', fromIndex);

  // Find light theme with flexible quote matching
  const lightThemeRegex = /\[data-bs-theme\s*=\s*['"]?light['"]?\s*\]/g;
  lightThemeRegex.lastIndex = fromIndex;
  const lightThemeMatch = lightThemeRegex.exec(text);
  const lightThemeIndex = lightThemeMatch ? lightThemeMatch.index : -1;

  const markers = [rootIndex, lightThemeIndex].filter((idx) => idx !== -1);
  return markers.length > 0 ? Math.min(...markers) : -1;
}

function readDeclarationBlock(text, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { block: text.slice(openBraceIndex + 1, i), endIndex: i };
      }
    }
  }
  return { block: '', endIndex: text.length };
}

function extractBlocks(cssText) {
  const blocks = [];
  let cursor = 0;
  for (;;) {
    const selIdx = nextMarkerIndex(cssText, cursor);
    if (selIdx === -1) break;
    const openBrace = cssText.indexOf('{', selIdx);
    if (openBrace === -1) break;
    const { block, endIndex } = readDeclarationBlock(cssText, openBrace);
    if (block) blocks.push(block);
    cursor = endIndex + 1;
  }
  return blocks;
}

function parseDeclarations(blockText) {
  const variables = new Map();
  const parts = blockText.split(';');
  for (const part of parts) {
    // Clean up the part by removing comments and excess whitespace
    const cleanPart = part.replaceAll(/\/\*.*?\*\//g, '').trim();
    if (!cleanPart) continue;

    const idx = cleanPart.indexOf(':');
    if (idx === -1) continue;

    const property = cleanPart.slice(0, idx).trim();
    if (!property.startsWith('--')) continue;

    let value = cleanPart.slice(idx + 1).trim();
    if (!value) continue;

    // Remove any trailing comments that might not have been caught by the regex
    const commentStart = value.indexOf('/*');
    if (commentStart !== -1) {
      value = value.slice(0, commentStart).trim();
    }

    if (!value) continue;
    variables.set(property, value);
  }
  return variables;
}

function shouldSkipVariable(property, value) {
  if (property.includes('dark')) return true;
  if (property.includes('surface-variant')) return true;
  if (property.includes('background') && value.includes('#212529')) return true;
  if (property.includes('bg') && value.includes('#212529')) return true;
  return false;
}

function filterAndOverrideVariables(allVariables) {
  const out = new Map();
  for (const [property, value] of allVariables.entries()) {
    // Check for forced overrides first, before applying skip logic
    if (property === '--bs-body-bg' || property === '--v-theme-background') {
      out.set(property, '#fff');
    } else if (
      property === '--bs-body-color' ||
      property === '--v-theme-on-background'
    ) {
      out.set(property, '#212529');
    } else if (shouldSkipVariable(property, value)) {
      continue; // Skip this variable entirely
    } else {
      out.set(property, value);
    }
  }
  return out;
}

function extractThemeVariables(cssText) {
  const blocks = extractBlocks(cssText);
  const collected = new Map();
  for (const block of blocks) {
    const vars = parseDeclarations(block);
    for (const [k, v] of vars.entries()) collected.set(k, v);
  }
  const filtered = filterAndOverrideVariables(collected);
  const variablesObject = {};
  for (const [k, v] of filtered.entries()) variablesObject[k] = v;
  return {
    variables: variablesObject,
    count: Object.keys(variablesObject).length,
    extracted: new Date().toISOString(),
  };
}

function buildHostThemeCss(variablesObject) {
  const lines = Object.entries(variablesObject).map(
    ([k, v]) => `  ${k}: ${v};`
  );

  // Shadow DOM compatibility fixes
  const shadowDomFixes = `
/* Shadow DOM compatibility fixes */
:host {
  /* Box-sizing fix for proper grid layout - inherits to all children */
  box-sizing: border-box;
  /* Font smoothing and text rendering - inherit from html element */
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  /* Tab size and word breaking behavior */
  -moz-tab-size: 4;
  tab-size: 4;
  word-break: normal;
}

*, *::before, *::after {
  /* Ensure all elements use border-box for consistent layout */
  box-sizing: inherit;
  /* Background repeat fix - matches normalize.css behavior */
  background-repeat: no-repeat;
}

/* Reset margins and padding - matches normalize.css */
* {
  padding: 0;
  margin: 0;
}`;

  return `/* CHEFS theme variables (scoped to component host) */
:host {
${lines.join('\n')}
}
${shadowDomFixes}
`;
}

module.exports = {
  nextMarkerIndex,
  readDeclarationBlock,
  extractBlocks,
  parseDeclarations,
  shouldSkipVariable,
  filterAndOverrideVariables,
  extractThemeVariables,
  buildHostThemeCss,
};
