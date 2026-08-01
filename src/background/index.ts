import { getRuntimeAPI, getScriptingAPI, getTabsAPI, getStorageAPI, isManifestV3 } from '@platform/browser-api';
import type { RuleType } from '@lib';

const runtime = getRuntimeAPI();
const scripting = getScriptingAPI();
const tabs = getTabsAPI();
const storage = getStorageAPI();

const injectedTabs = new Set<number>();

async function ensureContentScript(tabId: number): Promise<boolean> {
  if (injectedTabs.has(tabId)) return true;

  try {
    if (isManifestV3() && scripting) {
      await scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
        world: 'ISOLATED'
      });
      await scripting.executeScript({
        target: { tabId },
        files: ['injected.js'],
        world: 'MAIN',
        injectImmediately: true
      });
    } else if (tabs) {
      await tabs.executeScript(tabId, { file: 'content.js', runAt: 'document_idle' });
      await tabs.executeScript(tabId, { file: 'injected.js', runAt: 'document_start', allFrames: false });
    }
    injectedTabs.add(tabId);
    return true;
  } catch (e) {
    console.error('Failed to inject content script:', e);
    return false;
  }
}

interface BaseMessage {
  action: string;
}

interface GetStateMessage extends BaseMessage {
  action: 'getState';
}

interface SetStateMessage extends BaseMessage {
  action: 'setState';
  state: Record<string, any>;
}

interface StartPickerMessage extends BaseMessage {
  action: 'startPicker';
  ruleType: RuleType;
}

interface StopPickerMessage extends BaseMessage {
  action: 'stopPicker';
}

interface StartCaptureMessage extends BaseMessage {
  action: 'startCapture';
}

interface StopCaptureMessage extends BaseMessage {
  action: 'stopCapture';
}

interface SelectorSelectedMessage extends BaseMessage {
  action: 'selectorSelected';
  selector: string;
  ruleType: RuleType;
}

interface CaptureCompleteMessage extends BaseMessage {
  action: 'captureComplete';
  rule: any;
}

interface DebugConnectMessage extends BaseMessage {
  action: 'debugConnect';
}

interface DebugDisconnectMessage extends BaseMessage {
  action: 'debugDisconnect';
}

type ExtensionMessage = 
  | GetStateMessage 
  | SetStateMessage 
  | StartPickerMessage 
  | StopPickerMessage 
  | StartCaptureMessage 
  | StopCaptureMessage 
  | SelectorSelectedMessage 
  | CaptureCompleteMessage 
  | DebugConnectMessage 
  | DebugDisconnectMessage;

interface MessageSender {
  tab?: { id: number };
  [key: string]: any;
}

async function sendToTab(tabId: number, message: ExtensionMessage): Promise<any> {
  await ensureContentScript(tabId);
  return new Promise((resolve, reject) => {
    if (runtime) {
      runtime.sendMessage(tabId, message, (response: any) => {
        if (runtime.lastError) reject(runtime.lastError);
        else resolve(response);
      });
    } else {
      reject(new Error('Runtime API not available'));
    }
  });
}

function broadcastToViews(message: any): void {
  if (runtime) {
    runtime.sendMessage(message);
  }
}

function handleInstalled(): void {
  storage?.set?.({ legadoSourceState: {} });
}

async function handleMessage(message: ExtensionMessage, sender: MessageSender, sendResponse: (response: any) => void): Promise<void> {
  const tabId = sender.tab?.id;
  if (!tabId) {
    sendResponse({ error: 'No tab ID' });
    return;
  }

  try {
    switch (message.action) {
      case 'getState': {
        storage?.get?.('legadoSourceState', (result: any) => {
          sendResponse(result.legadoSourceState || {});
        });
        return;
      }

      case 'setState': {
        storage?.set?.({ legadoSourceState: message.state }, () => {
          broadcastToViews({ type: 'STATE_UPDATED', state: message.state });
          sendResponse({ success: true });
        });
        return;
      }

      case 'startPicker': {
        const result = await sendToTab(tabId, { action: 'startPicker', ruleType: message.ruleType });
        sendResponse(result);
        return;
      }

      case 'stopPicker': {
        const result = await sendToTab(tabId, { action: 'stopPicker' });
        sendResponse(result);
        return;
      }

      case 'startCapture': {
        const result = await sendToTab(tabId, { action: 'startCapture' });
        sendResponse(result);
        return;
      }

      case 'stopCapture': {
        const result = await sendToTab(tabId, { action: 'stopCapture' });
        sendResponse(result);
        return;
      }

      case 'selectorSelected': {
        broadcastToViews({ type: 'SELECTOR_SELECTED', selector: message.selector, ruleType: message.ruleType });
        sendResponse({ success: true });
        return;
      }

      case 'captureComplete': {
        broadcastToViews({ type: 'CAPTURE_COMPLETE', rule: message.rule });
        sendResponse({ success: true });
        return;
      }

      case 'debugConnect': {
        sendResponse({ success: true });
        return;
      }

      case 'debugDisconnect': {
        sendResponse({ success: true });
        return;
      }

      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (e) {
    sendResponse({ error: String(e) });
  }
}

function handleStorageChanged(changes: Record<string, { newValue: any }>, areaName: string): void {
  if (areaName === 'local' && changes['legadoSourceState']) {
    broadcastToViews({ type: 'STATE_UPDATED', state: changes['legadoSourceState'].newValue });
  }
}

function handleTabRemoved(tabId: number): void {
  injectedTabs.delete(tabId);
}

if (runtime) {
  runtime.onInstalled.addListener(handleInstalled);
  runtime.onMessage.addListener((message: ExtensionMessage, sender: MessageSender, sendResponse: (response: any) => void) => {
    handleMessage(message, sender, sendResponse);
    return true;
  });
}

if (storage) {
  storage.onChanged.addListener(handleStorageChanged);
}

if (tabs) {
  tabs.onRemoved.addListener(handleTabRemoved);
}

console.log('[Legado Source Generator] Background script loaded');