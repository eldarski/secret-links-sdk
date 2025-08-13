import { LinkInfo } from './types';

// URL Pattern matching for Secret Links
const LINK_PATTERNS = {
  secretLinks: /^https:\/\/secret\.annai\.ai\/link\/([a-zA-Z0-9_-]{16,64})(\?.*)?(#.*)?$/,
  // Future: Support for custom domains
  customDomain: /^https:\/\/([^\/]+)\/link\/([a-zA-Z0-9_-]{16,64})(\?.*)?(#.*)?$/
};

export function parseLink(url: string): LinkInfo {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      token: '',
      type: 'ping' as const,
      hasPassword: false,
      hasEncryption: false,
      domain: ''
    };
  }

  // Try to match Secret Links pattern first
  let match = url.match(LINK_PATTERNS.secretLinks);
  let domain = 'secret.annai.ai';
  let token = '';

  if (!match) {
    // Try custom domain pattern
    match = url.match(LINK_PATTERNS.customDomain);
    if (match) {
      domain = match[1];
      token = match[2];
    }
  } else {
    token = match[1];
  }

  if (!match || !token) {
    return {
      isValid: false,
      token: '',
      type: 'ping' as const,
      hasPassword: false,
      hasEncryption: false,
      domain: ''
    };
  }

  // Parse URL components
  const urlObj = new URL(url);
  const hasPassword = urlObj.searchParams.has('password');
  const hasEncryption = urlObj.hash.length > 1;
  const password = hasPassword ? urlObj.searchParams.get('password') || undefined : undefined;
  const encryptionKey = hasEncryption ? urlObj.hash.substring(1) : undefined;

  // Detect link type based on token patterns
  const type = detectLinkType(token);

  const linkInfo: LinkInfo = {
    isValid: true,
    token,
    type,
    hasPassword,
    hasEncryption,
    domain
  };

  if (password) {
    linkInfo.password = password;
  }

  if (encryptionKey) {
    linkInfo.encryptionKey = encryptionKey;
  }

  return linkInfo;
}

function detectLinkType(token: string): 'ping' | 'webhook' {
  // Basic heuristics for link type detection
  // This would need to be refined based on actual token patterns
  
  // Ping links: typically shorter tokens or specific prefixes
  if (token.length <= 24) {
    return 'ping';
  }
  
  // Webhook links: typically longer tokens
  return 'webhook';
}

export function generateClientId(): string {
  return `sdk-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export function validateSDKOptions(options: unknown): void {
  if (!options || typeof options !== 'object') {
    throw new Error('SDK options are required');
  }

  const opts = options as Record<string, unknown>;

  if (!opts.pollingEndpoint) {
    throw new Error('pollingEndpoint is required in SDK options');
  }

  if (typeof opts.pollingEndpoint !== 'string') {
    throw new Error('pollingEndpoint must be a string');
  }

  // Validate polling endpoint URL
  try {
    new URL(opts.pollingEndpoint);
  } catch {
    throw new Error('pollingEndpoint must be a valid URL');
  }

  // Validate intervals if provided
  if (opts.pingInterval !== undefined && (typeof opts.pingInterval !== 'number' || opts.pingInterval < 1000)) {
    throw new Error('pingInterval must be a number >= 1000 (1 second)');
  }

  if (opts.webhookInterval !== undefined && (typeof opts.webhookInterval !== 'number' || opts.webhookInterval < 1000)) {
    throw new Error('webhookInterval must be a number >= 1000 (1 second)');
  }
}

export function debugLog(debug: boolean, message: string, data?: unknown): void {
  if (debug) {
    // eslint-disable-next-line no-console
    console.log(`[SecretLinksSDK] ${message}`, data || '');
  }
}