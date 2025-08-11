import { parseLink, generateClientId } from '../utils';

describe('parseLink', () => {
  it('should validate valid Secret Links URLs', () => {
    const result = parseLink('https://secret.annai.ai/link/abc123def456ghi789');
    
    expect(result.isValid).toBe(true);
    expect(result.token).toBe('abc123def456ghi789');
    expect(result.type).toMatch(/^(ping|webhook)$/);
    expect(result.domain).toBe('secret.annai.ai');
    expect(result.hasPassword).toBe(false);
    expect(result.hasEncryption).toBe(false);
  });

  it('should validate Secret Links URLs with password', () => {
    const result = parseLink('https://secret.annai.ai/link/abc123def456ghi789?password=secret');
    
    expect(result.isValid).toBe(true);
    expect(result.token).toBe('abc123def456ghi789');
    expect(result.hasPassword).toBe(true);
    expect(result.password).toBe('secret');
  });

  it('should validate Secret Links URLs with encryption key', () => {
    const result = parseLink('https://secret.annai.ai/link/abc123def456ghi789#encryptionkey123');
    
    expect(result.isValid).toBe(true);
    expect(result.token).toBe('abc123def456ghi789');
    expect(result.hasEncryption).toBe(true);
    expect(result.encryptionKey).toBe('encryptionkey123');
  });

  it('should reject invalid URLs', () => {
    const invalidUrls = [
      '',
      'not-a-url',
      'https://example.com/link/abc123',
      'https://secret.annai.ai/not-link/abc123',
      'https://secret.annai.ai/link/', // no token
      'https://secret.annai.ai/link/abc' // token too short
    ];

    invalidUrls.forEach(url => {
      const result = parseLink(url);
      expect(result.isValid).toBe(false);
    });
  });

  it('should handle custom domains', () => {
    const result = parseLink('https://my-custom-domain.com/link/abc123def456ghi789');
    
    expect(result.isValid).toBe(true);
    expect(result.token).toBe('abc123def456ghi789');
    expect(result.domain).toBe('my-custom-domain.com');
  });
});

describe('generateClientId', () => {
  it('should generate unique client IDs', () => {
    const id1 = generateClientId();
    const id2 = generateClientId();
    
    expect(id1).toMatch(/^sdk-\d+-[a-z0-9]+$/);
    expect(id2).toMatch(/^sdk-\d+-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs with consistent format', () => {
    const id = generateClientId();
    
    expect(id.startsWith('sdk-')).toBe(true);
    expect(id.length).toBeGreaterThan(15);
  });
});

// Custom matcher for Jest
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});