// Jest setup file
import 'jest';

// Mock fetch for testing
global.fetch = require('jest-fetch-mock');

// Mock browser APIs
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: class MockNotification {
    static permission = 'default';
    static requestPermission = jest.fn().mockResolvedValue('granted');
    
    constructor(title: string, options?: NotificationOptions) {
      // Mock notification constructor
    }
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Mock setTimeout/clearTimeout for testing polling
jest.useFakeTimers();