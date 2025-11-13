import { create } from 'zustand';

interface UiStore {
  // 折叠状态
  expandedCards: Set<string>;

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
  toggleCard: (cardId: string) => void;
  expandAll: (messageIds: string[]) => void;
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
  expandedCards: new Set(),
  searchQuery: '',
  searchResults: [],
  fileSearchQuery: '',
  selectedMessageId: null,
  isStatsPanelExpanded: false,

  toggleCard: (cardId: string) => {
    set((state) => {
      const expanded = new Set(state.expandedCards);
      if (expanded.has(cardId)) {
        expanded.delete(cardId);
      } else {
        expanded.add(cardId);
      }
      return { expandedCards: expanded };
    });
  },

  expandAll: (messageIds: string[]) => {
    set({ expandedCards: new Set(messageIds) });
  },

  collapseAll: () => {
    set({ expandedCards: new Set() });
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
