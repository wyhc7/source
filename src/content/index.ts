import { getRuntimeAPI } from '@platform/browser-api';

const runtime = getRuntimeAPI();

interface Message {
  action: string;
  ruleType?: string;
  selector?: string;
  rule?: any;
  [key: string]: any;
}

let messageId = 0;
const pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (reason: any) => void }>();

function sendToInjected(message: Message): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = ++messageId;
    pendingRequests.set(id, { resolve, reject });

    window.postMessage({ ...message, __legadoId: id, __legadoFrom: 'content' }, '*');

    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Injected script timeout'));
      }
    }, 5000);
  });
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (!data.__legadoId || data.__legadoFrom !== 'injected') return;

  const request = pendingRequests.get(data.__legadoId);
  if (request) {
    pendingRequests.delete(data.__legadoId);
    if (data.error) {
      request.reject(new Error(data.error));
    } else {
      request.resolve(data.result);
    }
  }
});

async function sendToPopup(message: Message): Promise<any> {
  return new Promise((resolve, reject) => {
    if (runtime) {
      runtime.sendMessage(message, (response: any) => {
        if (runtime.lastError) reject(runtime.lastError);
        else resolve(response);
      });
    } else {
      reject(new Error('Runtime API not available'));
    }
  });
}

async function handleMessage(message: Message): Promise<any> {
  switch (message.action) {
    case 'startPicker': {
      const result = await sendToInjected({ action: 'startPicker', ruleType: message.ruleType });
      return result;
    }

    case 'stopPicker': {
      await sendToInjected({ action: 'stopPicker' });
      return { success: true };
    }

    case 'startCapture': {
      const result = await sendToInjected({ action: 'startCapture' });
      return result;
    }

    case 'stopCapture': {
      await sendToInjected({ action: 'stopCapture' });
      return { success: true };
    }

    case 'selectorSelected': {
      await sendToPopup({ action: 'selectorSelected', selector: message.selector, ruleType: message.ruleType });
      return { success: true };
    }

    case 'captureComplete': {
      await sendToPopup({ action: 'captureComplete', rule: message.rule });
      return { success: true };
    }

    default:
      return { error: 'Unknown action' };
  }
}

if (runtime) {
  runtime.onMessage.addListener((message: Message, _sender: any, sendResponse: (response: any) => void) => {
    handleMessage(message).then(sendResponse).catch((e: Error) => sendResponse({ error: String(e) }));
    return true;
  });
}

console.log('[Legado Source Generator] Content script loaded');