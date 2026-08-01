import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, RuleState, RuleType, FieldData, ExploreCard, Snippet, DebugState, SettingsState } from '@lib';

const DEFAULT_RULE_STATE: RuleState = {
  currentStep: 0,
  fields: {},
  fieldStates: {},
  bookListSelector: null,
  exploreCards: []
};

const DEFAULT_DEBUG_STATE: DebugState = {
  ip: ['192', '168', '1', '100'],
  port: 8080,
  wsConnected: false,
  logs: []
};

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'light',
  language: 'zh_CN'
};

function createChromeStorage() {
  return {
    getItem: (name: string): Promise<string | null> => {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.get([name], (result) => {
            resolve(result[name] ?? null);
          });
        } else {
          resolve(null);
        }
      });
    },
    setItem: (name: string, value: string): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ [name]: value }, () => resolve());
        } else {
          resolve();
        }
      });
    },
    removeItem: (name: string): Promise<void> => {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.remove([name], () => resolve());
        } else {
          resolve();
        }
      });
    }
  };
}

let debounceTimer: number | null = null;
const DEBOUNCE_MS = 300;

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeRuleType: 'search',
      rules: {
        search: { ...DEFAULT_RULE_STATE },
        bookInfo: { ...DEFAULT_RULE_STATE },
        toc: { ...DEFAULT_RULE_STATE },
        content: { ...DEFAULT_RULE_STATE },
        explore: { ...DEFAULT_RULE_STATE },
        debug: { ...DEFAULT_RULE_STATE }
      },
      debug: DEFAULT_DEBUG_STATE,
      snippets: [],
      settings: DEFAULT_SETTINGS,
      stateVersion: 1,

      setActiveRuleType: (type: RuleType) => set({ activeRuleType: type }),

      getRuleState: (type: RuleType) => get().rules[type],

      updateField: (type: RuleType, fieldKey: string, data: Partial<FieldData>) =>
        set(state => ({
          rules: {
            ...state.rules,
            [type]: {
              ...state.rules[type],
              fields: {
                ...state.rules[type].fields,
                [fieldKey]: { ...state.rules[type].fields[fieldKey], ...data }
              }
            }
          }
        })),

      setFieldState: (type: RuleType, fieldKey: string, state_: 'pending' | 'picking' | 'selected') =>
        set(state => ({
          rules: {
            ...state.rules,
            [type]: {
              ...state.rules[type],
              fieldStates: {
                ...state.rules[type].fieldStates,
                [fieldKey]: state_
              }
            }
          }
        })),

      setBookListSelector: (type: RuleType, selector: string | null) =>
        set(state => ({
          rules: {
            ...state.rules,
            [type]: { ...state.rules[type], bookListSelector: selector }
          }
        })),

      setCurrentStep: (type: RuleType, step: number) =>
        set(state => ({
          rules: {
            ...state.rules,
            [type]: { ...state.rules[type], currentStep: step }
          }
        })),

      addExploreCard: (card: ExploreCard) =>
        set(state => ({
          rules: {
            ...state.rules,
            explore: {
              ...state.rules.explore,
              exploreCards: [...state.rules.explore.exploreCards, card]
            }
          }
        })),

      updateExploreCard: (index: number, card: Partial<ExploreCard>) =>
        set(state => {
          const cards = [...state.rules.explore.exploreCards];
          if (cards[index]) cards[index] = { ...cards[index], ...card };
          return {
            rules: {
              ...state.rules,
              explore: { ...state.rules.explore, exploreCards: cards }
            }
          };
        }),

      removeExploreCard: (index: number) =>
        set(state => ({
          rules: {
            ...state.rules,
            explore: {
              ...state.rules.explore,
              exploreCards: state.rules.explore.exploreCards.filter((_, i) => i !== index)
            }
          }
        })),

      reorderExploreCards: (cards: ExploreCard[]) =>
        set(state => ({
          rules: {
            ...state.rules,
            explore: { ...state.rules.explore, exploreCards: cards }
          }
        })),

      setDebugIp: (ip: string[]) => set(state => ({ debug: { ...state.debug, ip } })),
      setDebugPort: (port: number) => set(state => ({ debug: { ...state.debug, port } })),
      setDebugWsConnected: (connected: boolean) => set(state => ({ debug: { ...state.debug, wsConnected: connected } })),
      addDebugLog: (log: string) => set(state => ({ debug: { ...state.debug, logs: [...state.debug.logs, log] } })),
      clearDebugLogs: () => set(state => ({ debug: { ...state.debug, logs: [] } })),

      setSnippets: (snippets: Snippet[]) => set({ snippets }),
      addSnippet: (snippet: Snippet) => set(state => ({ snippets: [...state.snippets, snippet] })),
      removeSnippet: (id: string) => set(state => ({ snippets: state.snippets.filter(s => s.id !== id) })),

      setSettings: (settings: Partial<SettingsState>) =>
        set(state => ({ settings: { ...state.settings, ...settings } })),

      reset: () => set({
        activeRuleType: 'search',
        rules: {
          search: { ...DEFAULT_RULE_STATE },
          bookInfo: { ...DEFAULT_RULE_STATE },
          toc: { ...DEFAULT_RULE_STATE },
          content: { ...DEFAULT_RULE_STATE },
          explore: { ...DEFAULT_RULE_STATE },
          debug: { ...DEFAULT_RULE_STATE }
        },
        debug: DEFAULT_DEBUG_STATE,
        snippets: [],
        settings: DEFAULT_SETTINGS,
        stateVersion: 1
      }),

      importState: (json: string) => {
        try {
          const imported = JSON.parse(json);
          set({
            activeRuleType: imported.activeRuleType || 'search',
            rules: imported.rules || get().rules,
            debug: { ...DEFAULT_DEBUG_STATE, ...imported.debug },
            snippets: imported.snippets || [],
            settings: { ...DEFAULT_SETTINGS, ...imported.settings },
            stateVersion: imported.stateVersion || 1
          });
        } catch (e) {
          console.error('Failed to import state:', e);
        }
      },

      exportState: () => JSON.stringify(get(), null, 2)
    }),
    {
      name: 'legadoSourceState',
      storage: createJSONStorage(() => createChromeStorage()),
      version: 1,
      partialize: (state) => ({
        activeRuleType: state.activeRuleType,
        rules: state.rules,
        debug: { ...state.debug, wsConnected: false, logs: [] },
        snippets: state.snippets,
        settings: state.settings,
        stateVersion: state.stateVersion
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.rules = {
            search: { ...DEFAULT_RULE_STATE, ...state.rules?.search },
            bookInfo: { ...DEFAULT_RULE_STATE, ...state.rules?.bookInfo },
            toc: { ...DEFAULT_RULE_STATE, ...state.rules?.toc },
            content: { ...DEFAULT_RULE_STATE, ...state.rules?.content },
            explore: { ...DEFAULT_RULE_STATE, ...state.rules?.explore },
            debug: { ...DEFAULT_RULE_STATE, ...state.rules?.debug }
          };
        }
      }
    }
  )
);

if (typeof window !== 'undefined') {
  const originalSet = useStore.setState;
  useStore.setState = (partial, replace) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      originalSet(partial, replace);
    }, DEBOUNCE_MS);
  };
}

export { useStore };