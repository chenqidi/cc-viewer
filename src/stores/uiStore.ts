import { create } from 'zustand';

export interface SearchResultEntry {
  id: string;
  messageId: string;
  occurrenceIndex: number;
}

interface UiStore {
  // 折叠状态，key 为 cardId，value 为当前展开状态
  expandedCards: Record<string, boolean>;

  // 消息搜索
  searchQuery: string;
  searchResults: SearchResultEntry[];
  activeSearchResultIndex: number;
  activeSearchResult: SearchResultEntry | null;

  // 文件搜索
  fileSearchQuery: string;

  // 统计面板展开状态
  isStatsPanelExpanded: boolean;

  // Actions
  registerCard: (cardId: string, defaultExpanded: boolean) => void;
  toggleCard: (cardId: string) => void;
  expandAll: (messageIds: string[]) => void;
  collapseCards: (messageIds: string[]) => void;
  collapseAll: () => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResultEntry[], options?: { resetIndex?: boolean }) => void;
  clearSearch: () => void;
  setFileSearchQuery: (query: string) => void;
  clearFileSearch: () => void;
  setActiveSearchResult: (result: SearchResultEntry | null) => void;
  setActiveSearchResultIndex: (index: number) => void;
  toggleStatsPanel: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  expandedCards: {},
  searchQuery: '',
  searchResults: [],
  activeSearchResultIndex: -1,
  activeSearchResult: null,
  fileSearchQuery: '',
  isStatsPanelExpanded: false,

  registerCard: (cardId: string, defaultExpanded: boolean) => {
    set((state) => {
      if (state.expandedCards[cardId] !== undefined) {
        return state;
      }
      return {
        expandedCards: {
          ...state.expandedCards,
          [cardId]: defaultExpanded,
        },
      };
    });
  },

  toggleCard: (cardId: string) => {
    set((state) => {
      const current = state.expandedCards[cardId] ?? false;
      return {
        expandedCards: {
          ...state.expandedCards,
          [cardId]: !current,
        },
      };
    });
  },

  expandAll: (messageIds: string[]) => {
    if (messageIds.length === 0) {
      return;
    }
    set((state) => {
      const expandedCards = { ...state.expandedCards };
      messageIds.forEach((id) => {
        expandedCards[id] = true;
      });
      return { expandedCards };
    });
  },

  collapseCards: (messageIds: string[]) => {
    if (messageIds.length === 0) {
      return;
    }
    set((state) => {
      const expandedCards = { ...state.expandedCards };
      messageIds.forEach((id) => {
        expandedCards[id] = false;
      });
      return { expandedCards };
    });
  },

  collapseAll: () => {
    set({ expandedCards: {} });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSearchResults: (results: SearchResultEntry[], options) => {
    set((state) => {
      let nextIndex = state.activeSearchResultIndex;
      if (results.length === 0) {
        nextIndex = -1;
      } else if (options?.resetIndex) {
        nextIndex = 0;
      } else if (nextIndex === -1 || nextIndex >= results.length) {
        nextIndex = 0;
      }

      const nextActive =
        results.length === 0
          ? null
          : options?.resetIndex || nextIndex === -1
            ? results[0]
            : state.activeSearchResult;

      return {
        searchResults: results,
        activeSearchResultIndex: nextIndex,
        activeSearchResult: nextActive,
      };
    });
  },

  clearSearch: () => {
    set({
      searchQuery: '',
      searchResults: [],
      activeSearchResultIndex: -1,
      activeSearchResult: null,
    });
  },

  setFileSearchQuery: (query: string) => {
    set({ fileSearchQuery: query });
  },

  clearFileSearch: () => {
    set({ fileSearchQuery: '' });
  },

  setActiveSearchResult: (result: SearchResultEntry | null) => {
    set({ activeSearchResult: result });
  },

  setActiveSearchResultIndex: (index: number) => {
    set((state) => {
      if (index < 0 || state.searchResults.length === 0) {
        return { activeSearchResultIndex: -1 };
      }

      const clamped = Math.min(index, state.searchResults.length - 1);
      return { activeSearchResultIndex: clamped };
    });
  },

  toggleStatsPanel: () => {
    set((state) => ({ isStatsPanelExpanded: !state.isStatsPanelExpanded }));
  },
}));
