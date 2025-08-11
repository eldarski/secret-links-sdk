# Secret Links SDK

A JavaScript SDK that enables website owners to integrate Secret Links functionality directly into their applications. Users can paste Secret Links URLs into input fields, and the SDK handles validation, polling, and payload delivery using the website owner's own infrastructure.

## 🚀 Key Features

- **Zero External Dependencies**: No reliance on Secret Links infrastructure for runtime operations
- **Framework Agnostic**: Works with React, Vue, Angular, or vanilla JavaScript
- **Adaptive Polling**: Intelligent polling that adjusts based on activity
- **TypeScript Support**: Full TypeScript definitions included
- **Multiple Link Types**: Support for both ping and webhook links
- **Real-time Notifications**: Browser notification support
- **Error Recovery**: Robust error handling and automatic retry logic

## 📦 Installation

### NPM
```bash
npm install secret-links-sdk
```

### CDN
```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/npm/secret-links-sdk@latest/dist/secret-links-sdk.min.js"></script>

<!-- Specific version -->
<script src="https://cdn.jsdelivr.net/npm/secret-links-sdk@1.0.0/dist/secret-links-sdk.min.js"></script>
```

## 🏗️ Architecture Overview

```
User Pastes Link → SDK Validates → Website's Backend Polls → SDK Delivers Payload
```

The SDK operates entirely through your infrastructure:
1. User pastes a Secret Links URL into your application
2. SDK validates and parses the link
3. Your backend polls Secret Links API for new content
4. SDK delivers payload to your callbacks when content arrives

## 🚀 Quick Start

### 1. Backend Integration (Required)

First, set up a polling endpoint in your backend. Here's an Express.js example:

```javascript
const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

app.post('/api/secret-links/poll', async (req, res) => {
  const { token, type, password } = req.body;
  
  try {
    // Poll Secret Links API
    const response = await fetch(`https://secret.annai.ai/api/links/${token}/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        clientId: `backend-${Date.now()}`,
        timestamp: Date.now()
      })
    });
    
    const data = await response.json();
    
    res.json({
      hasNewContent: data.hasNewContent,
      payload: data.payload,
      linkStatus: data.linkStatus || 'active',
      nextPollIn: data.nextPollIn || (type === 'ping' ? 10000 : 60000)
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. Frontend Integration

#### React Example

```tsx
import React, { useState, useMemo } from 'react';
import { SecretLinksSDK } from 'secret-links-sdk';

function MyComponent() {
  const [linkUrl, setLinkUrl] = useState('');
  const [messages, setMessages] = useState([]);
  
  const sdk = useMemo(() => new SecretLinksSDK({
    pollingEndpoint: '/api/secret-links/poll'
  }), []);

  const handleStartListening = async () => {
    try {
      await sdk.startListening(linkUrl, {
        onPayload: (payload, linkInfo) => {
          setMessages(prev => [...prev, payload]);
        },
        onError: (error) => console.error('Error:', error)
      });
    } catch (error) {
      alert('Invalid link: ' + error.message);
    }
  };

  return (
    <div>
      <input 
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
        placeholder="Paste Secret Link here..."
      />
      <button onClick={handleStartListening}>Start Listening</button>
      
      {messages.map((msg, i) => (
        <div key={i}>{JSON.stringify(msg)}</div>
      ))}
    </div>
  );
}
```

#### Vanilla JavaScript Example

```html
<script src="https://cdn.jsdelivr.net/npm/secret-links-sdk@latest/dist/secret-links-sdk.min.js"></script>

<script>
const sdk = new SecretLinksSDK.SecretLinksSDK({
  pollingEndpoint: '/api/secret-links/poll'
});

document.getElementById('startBtn').addEventListener('click', async () => {
  const linkUrl = document.getElementById('linkInput').value;
  
  try {
    await sdk.startListening(linkUrl, {
      onPayload: (payload) => {
        console.log('Received:', payload);
        // Handle the payload
      },
      onError: (error) => console.error('Error:', error)
    });
  } catch (error) {
    alert('Invalid link: ' + error.message);
  }
});
</script>
```

## 📖 API Reference

### SecretLinksSDK

#### Constructor Options

```typescript
interface SDKOptions {
  pollingEndpoint: string;        // Required: Your backend polling endpoint
  apiKey?: string;               // Optional: API key for your endpoint
  pingInterval?: number;         // Optional: Polling interval for ping links (default: 10000ms)
  webhookInterval?: number;      // Optional: Polling interval for webhook links (default: 60000ms)
  onError?: (error: Error) => void; // Optional: Global error handler
  debug?: boolean;               // Optional: Enable debug logging (default: false)
  validation?: ValidationOptions; // Optional: Custom validation rules
}
```

#### Methods

##### `validateLink(url: string): LinkInfo`
Validates and parses a Secret Links URL.

```typescript
const linkInfo = sdk.validateLink('https://secret.annai.ai/link/abc123?password=secret');
// Returns: { isValid: true, token: 'abc123', type: 'ping', hasPassword: true, ... }
```

##### `startListening(linkUrl: string, callbacks?: LinkCallbacks): Promise<string>`
Starts listening to a Secret Links URL and returns a unique listener ID.

```typescript
const listenerId = await sdk.startListening(linkUrl, {
  onPayload: (payload, linkInfo) => {
    console.log('New payload:', payload);
  },
  onError: (error, linkInfo) => {
    console.error('Error:', error);
  },
  onStatusChange: (status, linkInfo) => {
    console.log('Link status:', status);
  }
});
```

##### `stopListening(listenerId: string): void`
Stops listening to a specific link.

```typescript
sdk.stopListening(listenerId);
```

##### `stopAll(): void`
Stops all active listeners.

```typescript
sdk.stopAll();
```

### Callback Interfaces

#### LinkCallbacks

```typescript
interface LinkCallbacks {
  onPayload?: (payload: PayloadData, linkInfo: LinkInfo) => void;
  onError?: (error: Error, linkInfo: LinkInfo) => void;
  onStatusChange?: (status: LinkStatus, linkInfo: LinkInfo) => void;
}
```

#### PayloadData

```typescript
interface PayloadData {
  type: 'ping' | 'webhook';
  timestamp: number;
  data: any;                    // The actual payload content
  metadata?: {
    source: string;
    userAgent?: string;
    ipAddress?: string;
  };
}
```

## 🔗 Link Types

### Ping Links
- **Purpose**: Real-time notifications and alerts
- **Polling**: Fast intervals (5-30 seconds)
- **Use Cases**: Status updates, user interactions, simple notifications

### Webhook Links
- **Purpose**: Structured data delivery
- **Polling**: Configurable intervals (30s-5min)
- **Use Cases**: Form submissions, API integrations, data synchronization

## 🛡️ Security & Validation

### Custom Validation Rules

```typescript
const sdk = new SecretLinksSDK({
  pollingEndpoint: '/api/secret-links/poll',
  validation: {
    allowedDomains: ['secret.annai.ai'],
    allowedLinkTypes: ['ping'],
    requirePassword: true
  }
});
```

### Backend Security Best Practices

1. **Rate Limiting**: Implement rate limiting on your polling endpoint
2. **Authentication**: Use API keys to protect your polling endpoint
3. **Input Validation**: Validate all incoming data
4. **Error Handling**: Don't expose sensitive information in error messages
5. **Logging**: Log polling activities for monitoring and debugging

## 🔧 Advanced Features

### Multiple Link Support

```typescript
// Listen to multiple links simultaneously
const listeners = await Promise.all([
  sdk.startListening(pingLink1, { onPayload: handlePing }),
  sdk.startListening(webhookLink1, { onPayload: handleWebhook }),
  sdk.startListening(pingLink2, { onPayload: handlePing })
]);
```

### Adaptive Polling

The SDK automatically adjusts polling intervals based on activity:
- **Active links**: Fast polling when content is being received
- **Inactive links**: Gradual slowdown to reduce server load
- **Server suggestions**: Respects server-suggested polling intervals

### Debug Mode

```typescript
const sdk = new SecretLinksSDK({
  pollingEndpoint: '/api/secret-links/poll',
  debug: true  // Enables detailed console logging
});
```

## 📊 Monitoring & Statistics

### Listener Status

```typescript
// Get status of specific listener
const status = sdk.getListenerStatus(listenerId);

// Get status of all listeners
const allStatuses = sdk.getAllListenerStatuses();

// Check if SDK is actively listening
const isActive = sdk.isListening();
```

## 🚨 Error Handling

The SDK provides comprehensive error handling:

### Error Types
- **Validation Errors**: Invalid URLs or failed custom validation
- **Network Errors**: Connection issues with your backend
- **Server Errors**: Issues with Secret Links API
- **Link Status Changes**: Link expiration, exhaustion, or deletion

### Error Recovery
- **Automatic Retry**: Built-in retry logic with exponential backoff
- **Graceful Degradation**: Continues working even if some links fail
- **Status Monitoring**: Real-time status updates for all links

## 📦 Build & Distribution

The SDK is distributed in multiple formats:

- **ES Module**: `dist/secret-links-sdk.esm.js`
- **UMD**: `dist/secret-links-sdk.js`
- **Minified UMD**: `dist/secret-links-sdk.min.js`
- **TypeScript Definitions**: `dist/secret-links-sdk.d.ts`

## 🧪 Testing

```bash
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 🛠️ Development

```bash
npm install           # Install dependencies
npm run build         # Build the SDK
npm run build:watch   # Build in watch mode
npm run lint          # Run linting
npm run type-check    # Run TypeScript checks
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/eldarski/secret-links-sdk/wiki)
- **Issues**: [GitHub Issues](https://github.com/eldarski/secret-links-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/eldarski/secret-links-sdk/discussions)

## 🎯 Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Batch polling for multiple links
- [ ] Custom encryption key support
- [ ] React Native support
- [ ] Link grouping and management
- [ ] Persistent storage for listener recovery
- [ ] Advanced retry strategies
- [ ] Webhook signature verification

---

Made with ❤️ by the Secret Links team