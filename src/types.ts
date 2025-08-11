export interface SDKOptions {
  pollingEndpoint: string;
  apiKey?: string;
  pingInterval?: number;
  webhookInterval?: number;
  onError?: (error: Error) => void;
  debug?: boolean;
  validation?: ValidationOptions;
}

export interface ValidationOptions {
  allowedDomains?: string[];
  allowedLinkTypes?: ('ping' | 'webhook')[];
  requirePassword?: boolean;
}

export interface LinkInfo {
  isValid: boolean;
  token: string;
  type: 'ping' | 'webhook';
  hasPassword: boolean;
  hasEncryption: boolean;
  domain: string;
  password?: string;
  encryptionKey?: string;
}

export interface LinkCallbacks {
  onPayload?: (payload: PayloadData, linkInfo: LinkInfo) => void;
  onError?: (error: Error, linkInfo: LinkInfo) => void;
  onStatusChange?: (status: LinkStatus, linkInfo: LinkInfo) => void;
}

export interface PayloadData {
  type: 'ping' | 'webhook';
  timestamp: number;
  data: any;
  metadata?: {
    source: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

export type LinkStatus = 'active' | 'expired' | 'exhausted' | 'deleted';

export interface PollRequest {
  token: string;
  type: 'ping' | 'webhook';
  password?: string;
  clientId?: string;
  timestamp?: number;
  lastSeen?: number;
}

export interface PollResponse {
  hasNewContent: boolean;
  payload?: PayloadData;
  nextPollIn?: number;
  error?: string;
  linkStatus: LinkStatus;
}

export interface PollerOptions {
  endpoint: string;
  apiKey?: string;
  interval: number;
  callbacks: LinkCallbacks;
  debug?: boolean;
}