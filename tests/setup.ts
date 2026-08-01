import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(global, 'chrome', {
  value: {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
      onInstalled: { addListener: vi.fn() },
      getURL: vi.fn((path) => `chrome-extension://test/${path}`),
      id: 'test-extension-id'
    },
    storage: {
      local: {
        get: vi.fn((keys, callback) => callback({})),
        set: vi.fn((items, callback) => callback && callback()),
        remove: vi.fn((keys, callback) => callback && callback()),
        onChanged: { addListener: vi.fn() }
      }
    },
    tabs: {
      query: vi.fn(),
      sendMessage: vi.fn()
    },
    scripting: {
      executeScript: vi.fn()
    },
    sidePanel: {
      setOptions: vi.fn(),
      open: vi.fn()
    },
    i18n: {
      getMessage: vi.fn((key) => key),
      getUILanguage: vi.fn(() => 'zh-CN')
    }
  },
  writable: true
});

HTMLDialogElement.prototype.showModal = vi.fn();
HTMLDialogElement.prototype.close = vi.fn();