/**
 * Unit tests for Provider Registry
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

let initProvider, getActiveProvider, listProviders, PROVIDERS;

beforeEach(async () => {
  const m = await import('../../src/providers/providerRegistry.js');
  initProvider = m.initProvider;
  getActiveProvider = m.getActiveProvider;
  listProviders = m.listProviders;
  PROVIDERS = m.PROVIDERS;
});

describe('Provider Registry', () => {
  it('lists fake, omlx, and freellmapi providers', () => {
    const providers = listProviders();
    expect(providers).toContain('fake');
    expect(providers).toContain('omlx');
    expect(providers).toContain('freellmapi');
  });

  it('initProvider returns an instance for fake', () => {
    const p = initProvider('fake', { model: 'fake-model' });
    expect(p.providerId).toBe('fake');
    expect(p.model).toBe('fake-model');
  });

  it('initProvider returns an instance for omlx', () => {
    const p = initProvider('omlx', { baseUrl: 'http://localhost:11434' });
    expect(p.providerId).toBe('omlx');
    expect(p.baseUrl).toBe('http://localhost:11434');
  });

  it('initProvider returns an instance for freellmapi', () => {
    const p = initProvider('freellmapi', {
      baseUrl: 'https://api.freellmapi.com',
      apiKey: 'test-key',
      model: 'auto',
    });
    expect(p.providerId).toBe('freellmapi');
    expect(p.baseUrl).toBe('https://api.freellmapi.com');
    expect(p.apiKey).toBe('test-key');
    expect(p.model).toBe('auto');
  });

  it('initProvider throws for unknown provider', () => {
    expect(() => initProvider('unknown')).toThrow();
  });

  it('getActiveProvider returns the active instance', () => {
    initProvider('fake');
    const p = getActiveProvider();
    expect(p.providerId).toBe('fake');
  });
});
