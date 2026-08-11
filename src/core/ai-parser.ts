import type { AiError } from './ai-fetch';

export type AiGenerateStatus = 'idle' | 'fetching' | 'generating' | 'success' | 'error';

export interface AiGenerateResult {
  status: AiGenerateStatus;
  bookSource: Record<string, string> | null;
  rawResponse: string | null;
  error: AiError | null;
}

export function createInitialState(): AiGenerateResult {
  return {
    status: 'idle',
    bookSource: null,
    rawResponse: null,
    error: null
  };
}

export function isAiError(e: unknown): e is AiError {
  return typeof e === 'object' && e !== null && 'type' in e && 'message' in e;
}
