import { vi } from 'vitest';
import 'vitest-canvas-mock';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = window.ResizeObserver || ResizeObserverStub;

// Mock window methods that jsdom doesn't implement
if (typeof window.print !== 'function') {
  window.print = vi.fn();
}

if (typeof window.alert !== 'function') {
  window.alert = vi.fn();
}

if (typeof window.confirm !== 'function') {
  window.confirm = vi.fn(() => true);
}

if (typeof window.prompt !== 'function') {
  window.prompt = vi.fn(() => '');
}

if (typeof window.scrollTo !== 'function') {
  window.scrollTo = vi.fn();
}
