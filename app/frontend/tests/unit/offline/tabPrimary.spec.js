// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The module holds election state at module scope (tabId, primary id/ts, the
// `started` guard), so each test re-imports it after resetModules for a clean
// slate. happy-dom has no BroadcastChannel, so we supply one that records
// posted messages and lets us deliver messages as if from another tab.
class MockBroadcastChannel {
  static instances = [];
  constructor(name) {
    this.name = name;
    this.listeners = [];
    this.posted = [];
    MockBroadcastChannel.instances.push(this);
  }
  addEventListener(type, cb) {
    if (type === 'message') this.listeners.push(cb);
  }
  postMessage(data) {
    this.posted.push(data);
  }
  close() {}
  // Test helper: deliver a message to this channel's listeners (another tab).
  deliver(data) {
    this.listeners.forEach((cb) => cb({ data }));
  }
}

const CLAIM = 'primary-claim';
const RELEASE = 'primary-release';

function setVisibility(state) {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  });
}

async function freshModule() {
  vi.resetModules();
  MockBroadcastChannel.instances = [];
  return await import('~/offline/tabPrimary');
}

// The channel the freshly-started module created.
function activeChannel() {
  return MockBroadcastChannel.instances[MockBroadcastChannel.instances.length - 1];
}

// This tab's own CLAIM (learn its random tabId / ts from what it broadcast).
function ownClaim(channel) {
  return channel.posted.find((m) => m.type === CLAIM);
}

beforeEach(() => {
  vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
  setVisibility('visible');
  vi.spyOn(document, 'hasFocus').mockReturnValue(true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('offline/tabPrimary', () => {
  it('claims primary at startup when the tab is visible and broadcasts a claim', async () => {
    const mod = await freshModule();
    mod.startPrimaryElection();

    expect(mod.isPrimary.value).toBe(true);
    expect(ownClaim(activeChannel())).toBeTruthy();
  });

  it('does not claim primary when the tab is neither visible nor focused', async () => {
    setVisibility('hidden');
    document.hasFocus.mockReturnValue(false);
    const mod = await freshModule();
    mod.startPrimaryElection();

    expect(mod.isPrimary.value).toBe(false);
    expect(ownClaim(activeChannel())).toBeUndefined();
  });

  it('yields primary to another tab that claims with a higher timestamp', async () => {
    const mod = await freshModule();
    mod.startPrimaryElection();
    const ch = activeChannel();
    const mine = ownClaim(ch);

    ch.deliver({ type: CLAIM, tabId: 'other-tab', ts: mine.ts + 1000 });

    expect(mod.isPrimary.value).toBe(false);
  });

  it('keeps primary when another tab claims with a lower timestamp', async () => {
    const mod = await freshModule();
    mod.startPrimaryElection();
    const ch = activeChannel();
    const mine = ownClaim(ch);

    ch.deliver({ type: CLAIM, tabId: 'zzzz', ts: mine.ts - 1000 });

    expect(mod.isPrimary.value).toBe(true);
  });

  it('breaks an equal-timestamp tie by higher tabId', async () => {
    const mod = await freshModule();
    mod.startPrimaryElection();
    const ch = activeChannel();
    const mine = ownClaim(ch);

    // Same ts, LOWER id ('0' sorts below any hex/digit tab id) → must not win.
    ch.deliver({ type: CLAIM, tabId: '0', ts: mine.ts });
    expect(mod.isPrimary.value).toBe(true);

    // Same ts, HIGHER id ('g' sorts above any hex/digit tab id) → wins.
    ch.deliver({ type: CLAIM, tabId: 'g', ts: mine.ts });
    expect(mod.isPrimary.value).toBe(false);
  });

  it('re-claims (after jitter) when the current primary releases', async () => {
    vi.useFakeTimers();
    const mod = await freshModule();
    mod.startPrimaryElection();
    const ch = activeChannel();
    const mine = ownClaim(ch);

    // Another tab takes over, then releases.
    ch.deliver({ type: CLAIM, tabId: 'other-tab', ts: mine.ts + 1000 });
    expect(mod.isPrimary.value).toBe(false);
    ch.deliver({ type: RELEASE, tabId: 'other-tab' });

    // Re-claim is scheduled behind a 0-99ms jitter.
    await vi.advanceTimersByTimeAsync(150);
    expect(mod.isPrimary.value).toBe(true);
  });

  it('broadcasts a release and drops primary on pagehide', async () => {
    const mod = await freshModule();
    mod.startPrimaryElection();
    const ch = activeChannel();
    expect(mod.isPrimary.value).toBe(true);

    window.dispatchEvent(new Event('pagehide'));

    expect(ch.posted.some((m) => m.type === RELEASE)).toBe(true);
    expect(mod.isPrimary.value).toBe(false);
  });

  it('is idempotent — a second startPrimaryElection does not open another channel', async () => {
    const mod = await freshModule();
    mod.startPrimaryElection();
    const count = MockBroadcastChannel.instances.length;
    mod.startPrimaryElection();

    expect(MockBroadcastChannel.instances.length).toBe(count);
  });
});
