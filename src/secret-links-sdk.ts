import { SDKOptions, LinkInfo, LinkCallbacks, ValidationOptions } from './types';
import { LinkPoller } from './link-poller';
import { parseLink, validateSDKOptions, debugLog } from './utils';

export class SecretLinksSDK {
  private pollingEndpoint: string;
  private apiKey?: string;
  private intervals: {
    ping: number;
    webhook: number;
  };
  private activeListeners: Map<string, LinkPoller>;
  private onError: (error: Error) => void;
  private debug: boolean;
  private validation?: ValidationOptions;
  private listenerCounter: number;

  constructor(options: SDKOptions) {
    validateSDKOptions(options);

    this.pollingEndpoint = options.pollingEndpoint;
    this.apiKey = options.apiKey;
    this.intervals = {
      ping: options.pingInterval || 10000,
      webhook: options.webhookInterval || 60000
    };
    this.activeListeners = new Map();
    this.onError = options.onError || ((error: Error) => console.error('[SecretLinksSDK]', error));
    this.debug = options.debug || false;
    this.validation = options.validation;
    this.listenerCounter = 0;

    debugLog(this.debug, 'SDK initialized', {
      pollingEndpoint: this.pollingEndpoint,
      intervals: this.intervals,
      hasApiKey: !!this.apiKey,
      validation: this.validation
    });
  }

  /**
   * Validate and parse a Secret Links URL
   * @param url The Secret Links URL to validate
   * @returns LinkInfo object with validation result and parsed data
   */
  validateLink(url: string): LinkInfo {
    const linkInfo = parseLink(url);

    if (!linkInfo.isValid) {
      debugLog(this.debug, 'Link validation failed', { url });
      return linkInfo;
    }

    // Apply custom validation rules
    if (this.validation) {
      const validationError = this.applyValidationRules(linkInfo);
      if (validationError) {
        debugLog(this.debug, 'Custom validation failed', { url, error: validationError });
        return {
          ...linkInfo,
          isValid: false
        };
      }
    }

    debugLog(this.debug, 'Link validated successfully', {
      token: linkInfo.token.substring(0, 8) + '...',
      type: linkInfo.type,
      domain: linkInfo.domain,
      hasPassword: linkInfo.hasPassword
    });

    return linkInfo;
  }

  /**
   * Start listening to a Secret Links URL
   * @param linkUrl The Secret Links URL to listen to
   * @param callbacks Callback functions for handling events
   * @returns Promise<string> Unique listener ID for managing this listener
   */
  async startListening(linkUrl: string, callbacks: LinkCallbacks = {}): Promise<string> {
    const linkInfo = this.validateLink(linkUrl);
    
    if (!linkInfo.isValid) {
      throw new Error('Invalid Secret Link URL');
    }

    // Generate unique listener ID
    this.listenerCounter++;
    const listenerId = `listener-${Date.now()}-${this.listenerCounter}`;

    // Create poller instance
    const poller = new LinkPoller(linkInfo, {
      endpoint: this.pollingEndpoint,
      apiKey: this.apiKey,
      interval: this.intervals[linkInfo.type as 'ping' | 'webhook'] || this.intervals.ping,
      callbacks: {
        onPayload: callbacks.onPayload,
        onError: callbacks.onError || this.onError,
        onStatusChange: callbacks.onStatusChange
      },
      debug: this.debug
    });

    // Store the poller
    this.activeListeners.set(listenerId, poller);

    try {
      // Start polling
      await poller.start();
      
      debugLog(this.debug, 'Started listening to link', {
        listenerId,
        token: linkInfo.token.substring(0, 8) + '...',
        type: linkInfo.type
      });

      return listenerId;
    } catch (error) {
      // Clean up on error
      this.activeListeners.delete(listenerId);
      throw error;
    }
  }

  /**
   * Stop listening to a specific link
   * @param listenerId The listener ID returned from startListening
   */
  stopListening(listenerId: string): void {
    const poller = this.activeListeners.get(listenerId);
    
    if (!poller) {
      debugLog(this.debug, 'Listener not found', { listenerId });
      return;
    }

    poller.stop();
    this.activeListeners.delete(listenerId);

    debugLog(this.debug, 'Stopped listening', { listenerId });
  }

  /**
   * Stop all active listeners
   */
  stopAll(): void {
    const activeCount = this.activeListeners.size;
    
    for (const [listenerId, poller] of this.activeListeners) {
      poller.stop();
    }
    
    this.activeListeners.clear();

    debugLog(this.debug, `Stopped all listeners`, { count: activeCount });
  }

  /**
   * Get status of a specific listener
   * @param listenerId The listener ID
   * @returns Listener status or null if not found
   */
  getListenerStatus(listenerId: string) {
    const poller = this.activeListeners.get(listenerId);
    return poller ? poller.getStatus() : null;
  }

  /**
   * Get status of all active listeners
   * @returns Array of listener statuses
   */
  getAllListenerStatuses() {
    const statuses = [];
    
    for (const [listenerId, poller] of this.activeListeners) {
      statuses.push({
        listenerId,
        ...poller.getStatus()
      });
    }

    return statuses;
  }

  /**
   * Get the number of active listeners
   * @returns Number of active listeners
   */
  getActiveListenerCount(): number {
    return this.activeListeners.size;
  }

  /**
   * Check if SDK is listening to any links
   * @returns true if there are active listeners
   */
  isListening(): boolean {
    return this.activeListeners.size > 0;
  }

  private applyValidationRules(linkInfo: LinkInfo): string | null {
    if (!this.validation) {
      return null;
    }

    // Check allowed domains
    if (this.validation.allowedDomains && this.validation.allowedDomains.length > 0) {
      if (!this.validation.allowedDomains.includes(linkInfo.domain)) {
        return `Domain ${linkInfo.domain} is not allowed. Allowed domains: ${this.validation.allowedDomains.join(', ')}`;
      }
    }

    // Check allowed link types
    if (this.validation.allowedLinkTypes && this.validation.allowedLinkTypes.length > 0) {
      if (!this.validation.allowedLinkTypes.includes(linkInfo.type as 'ping' | 'webhook')) {
        return `Link type ${linkInfo.type} is not allowed. Allowed types: ${this.validation.allowedLinkTypes.join(', ')}`;
      }
    }

    // Check password requirement
    if (this.validation.requirePassword && !linkInfo.hasPassword) {
      return 'Password-protected links are required';
    }

    return null;
  }
}

// Export for CDN/browser usage
if (typeof window !== 'undefined') {
  (window as any).SecretLinksSDK = SecretLinksSDK;
}