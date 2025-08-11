import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SecretLinksSDK, PayloadData, LinkInfo } from '../src/index';

interface Message {
  id: string;
  payload: PayloadData;
  linkInfo: LinkInfo;
  timestamp: number;
}

export function ReactSecretLinksExample() {
  const [linkUrl, setLinkUrl] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentListenerId, setCurrentListenerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize SDK
  const sdk = useMemo(() => new SecretLinksSDK({
    pollingEndpoint: '/api/secret-links/poll',
    debug: true,
    onError: (error) => {
      console.error('SDK Global Error:', error);
      setError(error.message);
    }
  }), []);

  const handleStartListening = useCallback(async () => {
    if (!linkUrl.trim()) {
      setError('Please enter a Secret Links URL');
      return;
    }

    try {
      setError(null);
      
      const listenerId = await sdk.startListening(linkUrl, {
        onPayload: (payload: PayloadData, linkInfo: LinkInfo) => {
          const message: Message = {
            id: `${Date.now()}-${Math.random()}`,
            payload,
            linkInfo,
            timestamp: Date.now()
          };
          
          setMessages(prev => [message, ...prev]);
          
          // Show browser notification if available
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Secret Link Message', {
              body: `New ${payload.type} message received`,
              icon: '/favicon.ico'
            });
          }
        },
        onError: (error: Error, linkInfo: LinkInfo) => {
          console.error('Link Error:', error, linkInfo);
          setError(`Error from ${linkInfo.token.substring(0, 8)}...: ${error.message}`);
        },
        onStatusChange: (status, linkInfo: LinkInfo) => {
          console.log('Link status changed:', status, linkInfo);
          if (status !== 'active') {
            setIsListening(false);
            setCurrentListenerId(null);
            setError(`Link ${linkInfo.token.substring(0, 8)}... is now ${status}`);
          }
        }
      });
      
      setIsListening(true);
      setCurrentListenerId(listenerId);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start listening');
    }
  }, [linkUrl, sdk]);

  const handleStopListening = useCallback(() => {
    if (currentListenerId) {
      sdk.stopListening(currentListenerId);
      setIsListening(false);
      setCurrentListenerId(null);
    }
  }, [currentListenerId, sdk]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      sdk.stopAll();
    };
  }, [sdk]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Secret Links React Example
        </h1>
        
        {/* Link Input */}
        <div className="space-y-4">
          <div>
            <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Secret Links URL
            </label>
            <input
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://secret.annai.ai/link/..."
              disabled={isListening}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Controls */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleStartListening}
              disabled={isListening || !linkUrl.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
            >
              {isListening ? 'Listening...' : 'Start Listening'}
            </button>
            
            <button
              onClick={handleStopListening}
              disabled={!isListening}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
            >
              Stop Listening
            </button>
            
            <button
              onClick={clearMessages}
              disabled={messages.length === 0}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200"
            >
              Clear Messages ({messages.length})
            </button>

            <button
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg
                       transition-colors duration-200"
            >
              Enable Notifications
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Status Display */}
          {isListening && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200">
                🟢 Listening to link: {linkUrl}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Listener ID: {currentListenerId}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Messages Display */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Received Messages ({messages.length})
        </h2>
        
        {messages.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No messages received yet. Start listening to a Secret Link to see messages here.
          </p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      message.payload.type === 'ping' 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    }`}>
                      {message.payload.type}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      from {message.linkInfo.token.substring(0, 8)}...
                    </span>
                  </div>
                  <time className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </time>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(message.payload.data, null, 2)}
                  </pre>
                </div>
                
                {message.payload.metadata && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <strong>Metadata:</strong> {JSON.stringify(message.payload.metadata)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}