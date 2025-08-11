// Jest setup file
import 'jest';

// Mock fetch for testing
global.fetch = jest.fn();

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

// Mock console methods to reduce noise in tests (optional - can be enabled for cleaner test output)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn()
// };

// Mock setTimeout/clearTimeout for testing polling
// Note: Be careful with fake timers in tests - use sparingly
// jest.useFakeTimers();