import { debugLog } from './utils';

export class AdaptivePoller {
  private token: string;
  private baseInterval: number;
  public currentInterval: number;
  private backoffMultiplier: number;
  private maxInterval: number;
  private consecutiveEmpty: number;
  private debug: boolean;

  constructor(token: string, type: 'ping' | 'webhook', debug = false) {
    this.token = token;
    this.baseInterval = type === 'ping' ? 10000 : 60000; // 10s for ping, 1min for webhook
    this.currentInterval = this.baseInterval;
    this.backoffMultiplier = 1.5;
    this.maxInterval = 300000; // 5 minutes max
    this.consecutiveEmpty = 0;
    this.debug = debug;
  }

  adjustInterval(hasNewContent: boolean, nextPollIn?: number): void {
    if (nextPollIn && nextPollIn > 0) {
      // Server suggested next poll interval
      this.currentInterval = Math.max(nextPollIn, 1000); // Minimum 1 second
      debugLog(this.debug, `Using server-suggested interval: ${this.currentInterval}ms`);
      return;
    }

    if (hasNewContent) {
      // Reset to fast polling after activity
      this.currentInterval = this.baseInterval;
      this.consecutiveEmpty = 0;
      debugLog(this.debug, `Reset to base interval after activity: ${this.currentInterval}ms`);
    } else {
      // Gradually slow down if no activity
      this.consecutiveEmpty++;
      
      if (this.consecutiveEmpty >= 3) {
        const oldInterval = this.currentInterval;
        this.currentInterval = Math.min(
          this.currentInterval * this.backoffMultiplier,
          this.maxInterval
        );
        
        if (oldInterval !== this.currentInterval) {
          debugLog(this.debug, `Backing off polling interval: ${oldInterval}ms -> ${this.currentInterval}ms (${this.consecutiveEmpty} consecutive empty)`);
        }
      }
    }
  }

  reset(): void {
    this.currentInterval = this.baseInterval;
    this.consecutiveEmpty = 0;
    debugLog(this.debug, `Reset polling interval to base: ${this.baseInterval}ms`);
  }

  getInterval(): number {
    return this.currentInterval;
  }

  getConsecutiveEmpty(): number {
    return this.consecutiveEmpty;
  }
}