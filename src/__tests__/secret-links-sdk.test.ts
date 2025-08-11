import { SecretLinksSDK } from '../secret-links-sdk';

// Mock fetch for testing
global.fetch = jest.fn();

describe('SecretLinksSDK', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('constructor', () => {
    it('should create SDK instance with valid options', () => {
      const sdk = new SecretLinksSDK({
        pollingEndpoint: 'https://example.com/api/poll'
      });

      expect(sdk).toBeInstanceOf(SecretLinksSDK);
    });

    it('should throw error for missing pollingEndpoint', () => {
      expect(() => {
        new SecretLinksSDK({} as any);
      }).toThrow('pollingEndpoint is required');
    });

    it('should throw error for invalid pollingEndpoint URL', () => {
      expect(() => {
        new SecretLinksSDK({
          pollingEndpoint: 'not-a-url'
        });
      }).toThrow('pollingEndpoint must be a valid URL');
    });

    it('should accept optional configuration', () => {
      const sdk = new SecretLinksSDK({
        pollingEndpoint: 'https://example.com/api/poll',
        apiKey: 'test-key',
        pingInterval: 5000,
        webhookInterval: 30000,
        debug: true
      });

      expect(sdk).toBeInstanceOf(SecretLinksSDK);
    });
  });

  describe('validateLink', () => {
    let sdk: SecretLinksSDK;

    beforeEach(() => {
      sdk = new SecretLinksSDK({
        pollingEndpoint: 'https://example.com/api/poll'
      });
    });

    it('should validate valid Secret Links URL', () => {
      const result = sdk.validateLink('https://secret.annai.ai/link/abc123def456ghi789');
      
      expect(result.isValid).toBe(true);
      expect(result.token).toBe('abc123def456ghi789');
    });

    it('should reject invalid URLs', () => {
      const result = sdk.validateLink('https://example.com/invalid');
      
      expect(result.isValid).toBe(false);
    });

    it('should apply custom validation rules', () => {
      const sdk = new SecretLinksSDK({
        pollingEndpoint: 'https://example.com/api/poll',
        validation: {
          allowedDomains: ['allowed-domain.com'],
          requirePassword: true
        }
      });

      // Should reject domain not in allowedDomains
      const result1 = sdk.validateLink('https://secret.annai.ai/link/abc123def456ghi789');
      expect(result1.isValid).toBe(false);

      // Should reject link without password when requirePassword is true
      const result2 = sdk.validateLink('https://allowed-domain.com/link/abc123def456ghi789');
      expect(result2.isValid).toBe(false);

      // Should accept link that meets all criteria
      const result3 = sdk.validateLink('https://allowed-domain.com/link/abc123def456ghi789?password=secret');
      expect(result3.isValid).toBe(true);
    });
  });

  describe('startListening', () => {
    let sdk: SecretLinksSDK;

    beforeEach(() => {
      sdk = new SecretLinksSDK({
        pollingEndpoint: 'https://example.com/api/poll'
      });
    });

    it('should reject invalid URLs', async () => {
      await expect(
        sdk.startListening('invalid-url')
      ).rejects.toThrow('Invalid Secret Link URL');
    });

    it('should return listener ID for valid URLs', async () => {
      const listenerId = await sdk.startListening('https://secret.annai.ai/link/abc123def456ghi789', {
        onPayload: jest.fn(),
        onError: jest.fn()
      });

      expect(typeof listenerId).toBe('string');
      expect(listenerId).toMatch(/^listener-\d+-\d+$/);
    });
  });

  describe('stopListening', () => {
    let sdk: SecretLinksSDK;

    beforeEach(() => {
      sdk = new SecretLinksSDK({
        pollingEndpoint: 'https://example.com/api/poll'
      });
    });

    it('should handle non-existent listener IDs gracefully', () => {
      expect(() => {
        sdk.stopListening('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('utility methods', () => {
    let sdk: SecretLinksSDK;

    beforeEach(() => {
      sdk = new SecretLinksSDK({
        pollingEndpoint: 'https://example.com/api/poll'
      });
    });

    it('should report correct active listener count', () => {
      expect(sdk.getActiveListenerCount()).toBe(0);
    });

    it('should report listening status correctly', () => {
      expect(sdk.isListening()).toBe(false);
    });

    it('should return empty array for listener statuses when no listeners', () => {
      const statuses = sdk.getAllListenerStatuses();
      expect(statuses).toEqual([]);
    });
  });
});