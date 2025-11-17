import { create } from 'zustand';

interface UiStore {
  // 折叠状态，key 为 cardId，value 为当前展开状态
  expandedCards: Record<string, boolean>;

  // 消息搜索
  searchQuery: string;
  searchResults: string[]; // message IDs

  // 文件搜索
  fileSearchQuery: string;

  // 选中的消息
  selectedMessageId: string | null;

  // 统计面板展开状态
  isStatsPanelExpanded: boolean;

  // Actions
  registerCard: (cardId: string, defaultExpanded: boolean) => void;
  toggleCard: (cardId: string) => void;
  expandAll: (messageIds: string[]) => void;
  collapseCards: (messageIds: string[]) => void;
  collapseAll: () => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: string[]) => void;
  clearSearch: () => void;
  setFileSearchQuery: (query: string) => void;
  clearFileSearch: () => void;
  selectMessage: (messageId: string) => void;
  toggleStatsPanel: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  expandedCards: {},
  searchQuery: '',
  searchResults: [],
  fileSearchQuery: '',
  selectedMessageId: null,
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

  setSearchResults: (results: string[]) => {
    set({ searchResults: results });
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [] });
  },

  setFileSearchQuery: (query: string) => {
    set({ fileSearchQuery: query });
  },

  clearFileSearch: () => {
    set({ fileSearchQuery: '' });
  },

  selectMessage: (messageId: string) => {
    set({ selectedMessageId: messageId });
  },

  toggleStatsPanel: () => {
    set((state) => ({ isStatsPanelExpanded: !state.isStatsPanelExpanded }));
  },
}));
