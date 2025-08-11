import { LinkInfo, LinkCallbacks, PollRequest, PollResponse, PollerOptions } from './types';
import { AdaptivePoller } from './adaptive-poller';
import { generateClientId, debugLog } from './utils';

export class LinkPoller {
  private linkInfo: LinkInfo;
  private endpoint: string;
  private apiKey?: string;
  private callbacks: LinkCallbacks;
  private adaptive: AdaptivePoller;
  private isRunning: boolean;
  private timeoutId: NodeJS.Timeout | null;
  private debug: boolean;
  private clientId: string;
  private lastSeenTimestamp?: number;

  constructor(linkInfo: LinkInfo, options: PollerOptions) {
    this.linkInfo = linkInfo;
    this.endpoint = options.endpoint;
    this.apiKey = options.apiKey;
    this.callbacks = options.callbacks;
    this.adaptive = new AdaptivePoller(linkInfo.token, linkInfo.type, options.debug);
    this.isRunning = false;
    this.timeoutId = null;
    this.debug = options.debug || false;
    this.clientId = generateClientId();

    debugLog(this.debug, `Created poller for ${linkInfo.type} link`, {
      token: linkInfo.token.substring(0, 8) + '...',
      domain: linkInfo.domain,
      hasPassword: linkInfo.hasPassword,
      clientId: this.clientId
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      debugLog(this.debug, 'Poller already running');
      return;
    }

    this.isRunning = true;
    debugLog(this.debug, 'Starting poller', { token: this.linkInfo.token.substring(0, 8) + '...' });
    
    // Start polling immediately
    await this.poll();
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    debugLog(this.debug, 'Stopped poller', { token: this.linkInfo.token.substring(0, 8) + '...' });
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      const pollRequest: PollRequest = {
        token: this.linkInfo.token,
        type: this.linkInfo.type,
        password: this.linkInfo.password,
        clientId: this.clientId,
        timestamp: Date.now(),
        lastSeen: this.lastSeenTimestamp
      };

      debugLog(this.debug, 'Polling endpoint', {
        endpoint: this.endpoint,
        token: this.linkInfo.token.substring(0, 8) + '...',
        type: this.linkInfo.type
      });

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SecretLinksSDK/1.0.0',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(pollRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PollResponse = await response.json();

      debugLog(this.debug, 'Poll response received', {
        hasNewContent: result.hasNewContent,
        linkStatus: result.linkStatus,
        nextPollIn: result.nextPollIn
      });

      // Handle new content
      if (result.hasNewContent && result.payload) {
        this.lastSeenTimestamp = Date.now();
        this.callbacks.onPayload?.(result.payload, this.linkInfo);
        debugLog(this.debug, 'Payload delivered to callback', {
          payloadType: result.payload.type,
          timestamp: result.payload.timestamp
        });
      }

      // Handle link status changes
      if (result.linkStatus !== 'active') {
        this.callbacks.onStatusChange?.(result.linkStatus, this.linkInfo);
        debugLog(this.debug, 'Link status changed', {
          status: result.linkStatus,
          token: this.linkInfo.token.substring(0, 8) + '...'
        });
        
        if (result.linkStatus === 'expired' || result.linkStatus === 'deleted' || result.linkStatus === 'exhausted') {
          this.stop();
          return;
        }
      }

      // Handle errors from server
      if (result.error) {
        const error = new Error(`Server error: ${result.error}`);
        this.callbacks.onError?.(error, this.linkInfo);
        debugLog(this.debug, 'Server returned error', { error: result.error });
      }

      // Adjust polling interval
      this.adaptive.adjustInterval(result.hasNewContent, result.nextPollIn);
      this.scheduleNextPoll();

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.callbacks.onError?.(errorObj, this.linkInfo);
      debugLog(this.debug, 'Poll error', { 
        error: errorObj.message,
        token: this.linkInfo.token.substring(0, 8) + '...'
      });
      
      // Slow down on errors
      this.adaptive.adjustInterval(false);
      this.scheduleNextPoll();
    }
  }

  private scheduleNextPoll(): void {
    if (!this.isRunning) {
      return;
    }

    const interval = this.adaptive.getInterval();
    this.timeoutId = setTimeout(() => this.poll(), interval);
    
    debugLog(this.debug, `Next poll scheduled in ${interval}ms`);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      currentInterval: this.adaptive.getInterval(),
      consecutiveEmpty: this.adaptive.getConsecutiveEmpty(),
      clientId: this.clientId,
      token: this.linkInfo.token.substring(0, 8) + '...',
      type: this.linkInfo.type
    };
  }
}