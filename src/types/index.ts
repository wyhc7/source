export * from './book-source';

export interface SelectorOptions {
  root?: Element;
  useClassIntersection: boolean;
  maxDepth: number;
}

export interface SelectorResult {
  selector: string;
  matchedCount: number;
  isList: boolean;
  listItemTag?: string;
}

export interface CapturedSearchRule {
  searchUrl: string;
  method: 'GET' | 'POST';
  postBody?: string;
  charset?: string;
  headers?: Record<string, string>;
}

export interface IndexConfig {
  start?: number;
  end?: number;
  single?: number;
}

export interface IndexedRuleOptions {
  isList: boolean;
  fieldKey: string;
  listItemTag?: string;
  useJsIndex: boolean;
}

export interface ExploreCard {
  url: string;
  name: string;
  category: Record<string, string>;
  pageTemplate: string;
  enabled: boolean;
}

export interface Snippet {
  id: string;
  label: string;
  value: string;
}

export interface RuleState {
  currentStep: number;
  fields: Record<string, FieldData>;
  fieldStates: Record<string, 'pending' | 'picking' | 'selected'>;
  bookListSelector: string | null;
  exploreCards: ExploreCard[];
}

export interface FieldData {
  selector: string;
  useJsIndex: boolean;
  webView: boolean;
  listIndex?: IndexConfig;
}

export type RuleType = 'search' | 'bookInfo' | 'toc' | 'content' | 'explore' | 'debug';

export interface DebugState {
  ip: string[];
  port: number;
  wsConnected: boolean;
  logs: string[];
}

export interface SettingsState {
  theme: 'light' | 'dark';
  language: string;
}

export interface AppState {
  activeRuleType: RuleType;
  rules: Record<RuleType, RuleState>;
  debug: DebugState;
  snippets: Snippet[];
  settings: SettingsState;
  stateVersion: number;

  // Actions
  setActiveRuleType: (type: RuleType) => void;
  getRuleState: (type: RuleType) => RuleState;
  updateField: (type: RuleType, fieldKey: string, data: Partial<FieldData>) => void;
  setFieldState: (type: RuleType, fieldKey: string, state: 'pending' | 'picking' | 'selected') => void;
  setBookListSelector: (type: RuleType, selector: string | null) => void;
  setCurrentStep: (type: RuleType, step: number) => void;
  addExploreCard: (card: ExploreCard) => void;
  updateExploreCard: (index: number, card: Partial<ExploreCard>) => void;
  removeExploreCard: (index: number) => void;
  reorderExploreCards: (cards: ExploreCard[]) => void;
  setDebugIp: (ip: string[]) => void;
  setDebugPort: (port: number) => void;
  setDebugWsConnected: (connected: boolean) => void;
  addDebugLog: (log: string) => void;
  clearDebugLogs: () => void;
  setSnippets: (snippets: Snippet[]) => void;
  addSnippet: (snippet: Snippet) => void;
  removeSnippet: (id: string) => void;
  setSettings: (settings: Partial<SettingsState>) => void;
  reset: () => void;
  importState: (json: string) => void;
  exportState: () => string;
}