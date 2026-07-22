import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import 'vitest-canvas-mock';

config.global.stubs = {
  ...config.global.stubs,
  VImg: true,
  'v-img': true,
};


class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub;

// Mock window methods that jsdom doesn't implement
if (typeof globalThis.print !== 'function') {
  globalThis.print = vi.fn();
}

if (typeof globalThis.alert !== 'function') {
  globalThis.alert = vi.fn();
}

if (typeof globalThis.confirm !== 'function') {
  globalThis.confirm = vi.fn(() => true);
}

if (typeof globalThis.prompt !== 'function') {
  globalThis.prompt = vi.fn(() => '');
}

if (typeof globalThis.scrollTo !== 'function') {
  globalThis.scrollTo = vi.fn();
}
