const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store for tracking polling sessions (in production, use Redis or database)
const pollingSessions = new Map();

// Generate unique client ID
function generateClientId() {
  return `backend-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Rate limiting middleware (simple implementation)
const rateLimiter = new Map();
function createRateLimit(windowMs, maxRequests) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!rateLimiter.has(key)) {
      rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const limit = rateLimiter.get(key);
    
    if (now > limit.resetTime) {
      // Reset window
      limit.count = 1;
      limit.resetTime = now + windowMs;
      return next();
    }
    
    if (limit.count >= maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((limit.resetTime - now) / 1000)
      });
    }
    
    limit.count++;
    next();
  };
}

// Apply rate limiting: 60 requests per minute per IP
app.use('/api/secret-links/poll', createRateLimit(60000, 60));

/**
 * Secret Links Polling Endpoint
 * This endpoint handles polling requests from the SDK
 */
app.post('/api/secret-links/poll', async (req, res) => {
  const { token, type, password, clientId, timestamp, lastSeen } = req.body;
  
  // Validate request
  if (!token || !type) {
    return res.status(400).json({ 
      error: 'Missing required fields: token and type are required' 
    });
  }
  
  if (!['ping', 'webhook'].includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid link type. Must be ping or webhook' 
    });
  }

  const sessionKey = `${token}-${clientId || 'anonymous'}`;
  
  try {
    console.log(`[${new Date().toISOString()}] Polling Secret Links API`, {
      token: token.substring(0, 8) + '...',
      type,
      hasPassword: !!password,
      clientId,
      sessionKey
    });

    // Make request to Secret Links API
    const secretLinksResponse = await fetch(`https://secret.annai.ai/api/links/${token}/poll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ExpressJS-SecretLinksSDK/1.0.0',
        'X-Forwarded-For': req.ip,
        'X-Client-ID': clientId || generateClientId()
      },
      body: JSON.stringify({
        password,
        clientId: clientId || generateClientId(),
        timestamp: timestamp || Date.now(),
        lastSeen: lastSeen || pollingSessions.get(sessionKey)?.lastSeen
      }),
      timeout: 10000 // 10 second timeout
    });

    if (!secretLinksResponse.ok) {
      const errorText = await secretLinksResponse.text();
      console.error('Secret Links API error:', {
        status: secretLinksResponse.status,
        statusText: secretLinksResponse.statusText,
        body: errorText
      });
      
      return res.status(secretLinksResponse.status).json({
        error: `Secret Links API error: ${secretLinksResponse.statusText}`,
        hasNewContent: false,
        linkStatus: 'error'
      });
    }

    const data = await secretLinksResponse.json();
    
    console.log('Secret Links API response:', {
      token: token.substring(0, 8) + '...',
      hasNewContent: data.hasNewContent,
      linkStatus: data.linkStatus,
      payloadSize: data.payload ? JSON.stringify(data.payload).length : 0
    });

    // Update session tracking
    if (data.hasNewContent) {
      pollingSessions.set(sessionKey, {
        lastSeen: Date.now(),
        lastPayload: data.payload,
        pollCount: (pollingSessions.get(sessionKey)?.pollCount || 0) + 1
      });
    }

    // Process payload based on type
    if (data.hasNewContent && data.payload) {
      await processPayload(token, type, data.payload, req);
    }

    // Calculate suggested next poll interval
    const nextPollIn = calculateNextPollInterval(type, data.hasNewContent, data.linkStatus);
    
    res.json({
      success: true,
      hasNewContent: data.hasNewContent,
      payload: data.payload,
      nextPollIn,
      linkStatus: data.linkStatus || 'active',
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Polling error:', {
      error: error.message,
      token: token.substring(0, 8) + '...',
      type,
      stack: error.stack
    });
    
    // Handle different types of errors
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      statusCode = 503;
      errorMessage = 'Secret Links service unavailable';
    } else if (error.name === 'AbortError' || error.code === 'TIMEOUT') {
      statusCode = 504;
      errorMessage = 'Request timeout';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      hasNewContent: false,
      linkStatus: 'error',
      retryAfter: 30 // Suggest retry after 30 seconds
    });
  }
});

/**
 * Process received payload based on link type
 */
async function processPayload(token, type, payload, req) {
  const tokenPreview = token.substring(0, 8) + '...';
  
  console.log(`Processing ${type} payload from ${tokenPreview}:`, {
    type: payload.type,
    timestamp: payload.timestamp,
    dataSize: payload.data ? JSON.stringify(payload.data).length : 0,
    hasMetadata: !!payload.metadata
  });

  if (type === 'ping') {
    // Handle ping payloads - typically simple notifications
    console.log('Ping message received:', payload.data);
    
    // Example: Send email notification, push to notification service, etc.
    // await sendNotification({
    //   type: 'ping',
    //   message: payload.data,
    //   source: tokenPreview
    // });
    
  } else if (type === 'webhook') {
    // Handle webhook payloads - typically structured data
    console.log('Webhook data received:', payload.data);
    
    // Example: Process form submission, update database, trigger workflow, etc.
    // await processWebhookData({
    //   data: payload.data,
    //   metadata: payload.metadata,
    //   source: tokenPreview,
    //   receivedAt: new Date()
    // });
  }
}

/**
 * Calculate next polling interval based on activity and link type
 */
function calculateNextPollInterval(type, hasNewContent, linkStatus) {
  // Base intervals
  const baseIntervals = {
    ping: 10000,    // 10 seconds
    webhook: 60000  // 1 minute
  };
  
  const baseInterval = baseIntervals[type] || baseIntervals.ping;
  
  // Adjust based on activity
  if (hasNewContent) {
    return baseInterval; // Keep polling frequently if there's activity
  }
  
  // Slow down if no activity
  if (linkStatus === 'active') {
    return baseInterval * 1.5; // Slightly slower
  }
  
  // Much slower for inactive links
  return Math.min(baseInterval * 3, 300000); // Max 5 minutes
}

/**
 * Health check endpoint
 */
app.get('/api/secret-links/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeSessions: pollingSessions.size,
    uptime: process.uptime()
  });
});

/**
 * Get polling statistics (for debugging)
 */
app.get('/api/secret-links/stats', (req, res) => {
  const stats = {
    activeSessions: pollingSessions.size,
    sessions: Array.from(pollingSessions.entries()).map(([key, data]) => ({
      sessionKey: key,
      lastSeen: data.lastSeen ? new Date(data.lastSeen).toISOString() : null,
      pollCount: data.pollCount,
      hasPayload: !!data.lastPayload
    }))
  };
  
  res.json(stats);
});

/**
 * Clear old polling sessions (cleanup job)
 */
function cleanupOldSessions() {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  
  let cleaned = 0;
  for (const [key, session] of pollingSessions.entries()) {
    if (session.lastSeen && (now - session.lastSeen > maxAge)) {
      pollingSessions.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} old polling sessions`);
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupOldSessions, 10 * 60 * 1000);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`Secret Links SDK Backend running on port ${port}`);
  console.log(`Polling endpoint: http://localhost:${port}/api/secret-links/poll`);
  console.log(`Health check: http://localhost:${port}/api/secret-links/health`);
  console.log(`Statistics: http://localhost:${port}/api/secret-links/stats`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});