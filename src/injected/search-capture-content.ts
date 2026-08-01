import { startCapture as coreStartCapture, stopCapture as coreStopCapture, type CapturedSearchRule } from '../core/search-capture';

interface CaptureCallbacks {
  onCaptured: (rule: CapturedSearchRule) => void;
  onError: (error: Error) => void;
}

export class SearchCapture {
  private callbacks: CaptureCallbacks | null = null;
  private cleanup: (() => void) | null = null;

  startCapture(): Promise<CapturedSearchRule | null> {
    return new Promise((resolve) => {
      this.callbacks = {
        onCaptured: (rule) => {
          this.cleanup?.();
          this.cleanup = null;
          this.sendToPopup(rule);
          resolve(rule);
        },
        onError: (error) => {
          this.cleanup?.();
          this.cleanup = null;
          console.error('[Legado Capture] Error:', error);
          resolve(null);
        }
      };

      coreStartCapture(0, this.callbacks);
    });
  }

  private sendToPopup(rule: CapturedSearchRule): void {
    if (typeof window !== 'undefined' && window.chrome?.runtime) {
      window.chrome.runtime.sendMessage({
        action: 'captureComplete',
        rule
      });
    }
  }

  destroy(): void {
    this.cleanup?.();
    this.cleanup = null;
    coreStopCapture(0);
  }
}

console.log('[Legado Source Generator] Injected capture loaded');