import { generateSelector, countMatches } from '../core/selector-generator';

interface PickerCallbacks {
  onPick: (selector: string) => void;
  onCancel: () => void;
}

interface InjectedMessage {
  action: string;
  ruleType?: string;
  __legadoId?: number;
  __legadoFrom?: string;
}

let currentPicker: ElementPicker | null = null;
let currentCapture: any = null;

function sendResponse(id: number, result: any, error?: string): void {
  window.postMessage({
    __legadoId: id,
    __legadoFrom: 'injected',
    result,
    error
  }, '*');
}

async function handleMessage(message: InjectedMessage): Promise<void> {
  const id = message.__legadoId;
  if (!id) return;

  switch (message.action) {
    case 'startPicker': {
      if (currentPicker) {
        currentPicker.destroy();
        currentPicker = null;
      }
      currentPicker = new ElementPicker();
      currentPicker.startPick(message.ruleType || 'list', {
        onPick: (selector) => {
          sendResponse(id, { selector });
        },
        onCancel: () => {
          sendResponse(id, { selector: '' });
        }
      });
      break;
    }

    case 'stopPicker': {
      if (currentPicker) {
        currentPicker.destroy();
        currentPicker = null;
      }
      sendResponse(id, { success: true });
      break;
    }

    case 'startCapture': {
      const { SearchCapture } = await import('./search-capture-content');
      currentCapture = new SearchCapture();
      currentCapture.startCapture().then((rule: any) => {
        sendResponse(id, { rule });
      }).catch((e: Error) => {
        sendResponse(id, null, String(e));
      });
      break;
    }

    case 'stopCapture': {
      if (currentCapture) {
        currentCapture.destroy();
        currentCapture = null;
      }
      sendResponse(id, { success: true });
      break;
    }
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (!data.__legadoId || data.__legadoFrom !== 'content') return;

  handleMessage(data);
});

export class ElementPicker {
  private root: Element = document.body;
  private highlightEl: HTMLElement | null = null;
  private tooltipEl: HTMLElement | null = null;
  private callbacks: PickerCallbacks | null = null;
  private isActive = false;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private mousemoveHandler: ((e: MouseEvent) => void) | null = null;
  private clickHandler: ((e: MouseEvent) => void) | null = null;

  startPick(ruleType: string, callbacks: PickerCallbacks): Promise<string> {
    return new Promise((resolve) => {
      this.callbacks = {
        onPick: (selector) => {
          this.destroy();
          resolve(selector);
          callbacks.onPick(selector);
        },
        onCancel: () => {
          this.destroy();
          resolve('');
          callbacks.onCancel();
        }
      };
      this.activate();
    });
  }

  private activate(): void {
    this.isActive = true;
    this.injectStyles();
    this.bindEvents();
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.id = 'legado-picker-styles';
    style.textContent = `
      .legado-picker-highlight {
        position: absolute;
        pointer-events: none;
        border: 2px solid #1890ff;
        background: rgba(24, 144, 255, 0.15);
        border-radius: 2px;
        z-index: 2147483646;
        box-sizing: border-box;
        transition: all 0.05s ease;
      }
      .legado-picker-tooltip {
        position: absolute;
        pointer-events: none;
        padding: 4px 8px;
        font-size: 11px;
        font-family: monospace;
        color: #fff;
        background: #1890ff;
        border-radius: 3px;
        white-space: nowrap;
        z-index: 2147483647;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .legado-picker-tooltip::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: #1890ff;
      }
    `;
    document.head.appendChild(style);
  }

  private bindEvents(): void {
    this.mousemoveHandler = (e) => this.handleMouseMove(e);
    this.clickHandler = (e) => this.handleClick(e);
    this.keydownHandler = (e) => this.handleKeyDown(e);

    document.addEventListener('mousemove', this.mousemoveHandler, true);
    document.addEventListener('click', this.clickHandler, true);
    document.addEventListener('keydown', this.keydownHandler, true);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isActive) return;
    const target = e.target as HTMLElement;
    if (!target || target === this.highlightEl || target === this.tooltipEl || target.id === 'legado-picker-styles') return;

    this.updateHighlight(target);
  }

  private updateHighlight(element: HTMLElement): void {
    if (!this.highlightEl) {
      this.highlightEl = document.createElement('div');
      this.highlightEl.className = 'legado-picker-highlight';
      document.body.appendChild(this.highlightEl);
    }

    if (!this.tooltipEl) {
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.className = 'legado-picker-tooltip';
      document.body.appendChild(this.tooltipEl);
    }

    const rect = element.getBoundingClientRect();
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    this.highlightEl.style.left = `${rect.left + scrollX}px`;
    this.highlightEl.style.top = `${rect.top + scrollY}px`;
    this.highlightEl.style.width = `${rect.width}px`;
    this.highlightEl.style.height = `${rect.height}px`;

    const path = this.getSelectorPath(element);
    const count = countMatches(path, this.root);
    this.tooltipEl.textContent = `${path} (${count})`;

    const tooltipRect = this.tooltipEl.getBoundingClientRect();
    let tooltipLeft = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
    let tooltipTop = rect.top + scrollY - tooltipRect.height - 8;

    if (tooltipTop < scrollY + 8) {
      tooltipTop = rect.bottom + scrollY + 8;
      this.tooltipEl.style.borderTopColor = 'transparent';
      this.tooltipEl.style.borderBottomColor = '#1890ff';
      (this.tooltipEl.style as any).after = 'border-top-color: transparent; border-bottom-color: #1890ff;';
    }

    this.tooltipEl.style.left = `${Math.max(8, Math.min(tooltipLeft, window.innerWidth - tooltipRect.width - 8))}px`;
    this.tooltipEl.style.top = `${tooltipTop}px`;
  }

  private getSelectorPath(element: Element): string {
    const result = generateSelector(this.root, element, { useClassIntersection: true, maxDepth: 10 });
    return result.selector;
  }

  private handleClick(e: MouseEvent): void {
    if (!this.isActive) return;
    const target = e.target as HTMLElement;
    if (!target || target === this.highlightEl || target === this.tooltipEl) return;

    e.preventDefault();
    e.stopPropagation();

    const selector = this.getSelectorPath(target);
    this.callbacks?.onPick(selector);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isActive) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.callbacks?.onCancel();
    }
  }

  destroy(): void {
    this.isActive = false;

    if (this.mousemoveHandler) {
      document.removeEventListener('mousemove', this.mousemoveHandler, true);
      this.mousemoveHandler = null;
    }
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
      this.clickHandler = null;
    }
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler, true);
      this.keydownHandler = null;
    }

    this.highlightEl?.remove();
    this.highlightEl = null;
    this.tooltipEl?.remove();
    this.tooltipEl = null;

    const style = document.getElementById('legado-picker-styles');
    style?.remove();

    this.callbacks = null;
  }
}

console.log('[Legado Source Generator] Injected picker loaded');