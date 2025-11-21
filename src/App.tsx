import { useMemo, useEffect, useCallback, useState, useRef } from "react";
import { Button } from "./components/ui/button";
import { Dialog } from "./components/ui/dialog";
import { MainLayout } from "./components/layout/MainLayout";
import { Sidebar } from "./components/layout/Sidebar";
import { MessagePanel } from "./components/layout/MessagePanel";
import { FileList } from "./components/FileList";
import { MessageCard } from "./components/cards/MessageCard";
import { StatsPanel } from "./components/StatsPanel";
import { SearchBar } from "./components/SearchBar";
import { SimpleEmptyState } from "./components/ui/empty-state";
import { useFileStore } from "./stores/fileStore";
import { useUiStore, type SearchResultEntry } from "./stores/uiStore";
import { calculateStats } from "./lib/stats";
import { escapeRegex } from "./lib/utils";
import { useKeyboard } from "./hooks/useKeyboard";

function App() {
  const {
    selectedFileId,
    currentMessages,
    files,
    refreshFile,
    isMessageLoading,
  } = useFileStore();
  const {
    searchQuery,
    setSearchResults,
    expandedCards,
    expandAll,
    collapseCards,
    collapseAll,
    isStatsPanelExpanded,
    toggleStatsPanel,
    activeSearchResult,
    setActiveSearchResult,
  } = useUiStore();

  // 自动刷新状态
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshTimerRef = useRef<number | null>(null);
  const lastSearchQueryRef = useRef(searchQuery);
  const lastFileIdRef = useRef<string | null>(selectedFileId ?? null);

  // 获取当前选中的文件信息
  const selectedFile = files.find(f => f.id === selectedFileId);

  // 计算当前消息的统计数据
  const stats = useMemo(() => {
    if (currentMessages.length === 0) return null;
    return calculateStats(currentMessages);
  }, [currentMessages]);

  // 搜索逻辑：过滤匹配的消息
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentMessages;
    }

    const query = searchQuery.toLowerCase();
    return currentMessages.filter((message) => {
      // 搜索文本内容
      if (message.textContent?.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索思考内容
      if (message.thinkingContent?.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索工具名称和结果
      if (message.toolCalls) {
        for (const tool of message.toolCalls) {
          if (tool.name.toLowerCase().includes(query)) {
            return true;
          }
          if (tool.result?.toLowerCase().includes(query)) {
            return true;
          }
        }
      }

      return false;
    });
  }, [currentMessages, searchQuery]);

  // 更新搜索结果到 store（按出现次数展开）
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    const queryChanged = lastSearchQueryRef.current !== searchQuery;
    const currentFileId = selectedFileId ?? null;
    const fileChanged = lastFileIdRef.current !== currentFileId;

    if (queryChanged) {
      lastSearchQueryRef.current = searchQuery;
    }
    if (fileChanged) {
      lastFileIdRef.current = currentFileId;
    }

    if (!trimmedQuery) {
      setSearchResults([], { resetIndex: true });
      return;
    }

    const results: SearchResultEntry[] = [];
    const regex = new RegExp(`(${escapeRegex(trimmedQuery)})`, 'gi');

    const stripCodeFromMarkdown = (md: string): string => {
      if (!md) return md;
      // 去除围栏代码块与行内代码，避免计入未高亮部分
      return md
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '');
    };

    filteredMessages.forEach((m) => {
      const segments: string[] = [];
      const addSegmentIfAny = (text?: string, sanitizer?: (s: string) => string) => {
        if (!text) return;
        const sanitized = sanitizer ? sanitizer(text) : text;
        const trimmed = sanitized.trim();
        if (trimmed) {
          segments.push(trimmed);
        }
      };

      if (m.markdownSegments && m.markdownSegments.length > 0) {
        addSegmentIfAny(m.markdownSegments.join('\n\n'), stripCodeFromMarkdown);
      } else if (typeof m.textContent === 'string') {
        addSegmentIfAny(m.textContent);
      }

      // 注意：thinkingContent 已经包含在 markdownSegments 中了（见 parser.ts:151）
      // 所以不应该重复添加，否则会导致重复计数

      m.toolCalls?.forEach((tool) => {
        addSegmentIfAny(tool.result);
      });

      let occurrenceIdx = 0;
      segments.forEach((text) => {
        const matches = [...text.matchAll(regex)];
        matches.forEach(() => {
          results.push({
            id: `${m.id}-${results.length}`,
            messageId: m.id,
            occurrenceIndex: occurrenceIdx++,
          });
        });
      });
    });

    setSearchResults(results, { resetIndex: queryChanged || fileChanged });
  }, [filteredMessages, searchQuery, selectedFileId, setSearchResults, setActiveSearchResult]);

  // 搜索跳转：滚动定位到当前选中的消息卡片
  useEffect(() => {
    if (!activeSearchResult) return;

    const { messageId, occurrenceIndex } = activeSearchResult;
    const escapedId =
      typeof CSS !== 'undefined' && CSS.escape
        ? CSS.escape(messageId)
        : messageId.replace(/"/g, '\\"');
    const target = document.querySelector<HTMLElement>(
      `[data-message-id="${escapedId}"]`
    );
    if (!target) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    const highlightMarks = Array.from(target.querySelectorAll<HTMLElement>('mark'));
    const highlightTarget =
      highlightMarks[occurrenceIndex] ?? highlightMarks[0] ?? target;

    highlightTarget.classList.remove('search-flash');
    // 触发重绘以便重复添加动画
    void highlightTarget.offsetWidth;
    highlightTarget.classList.add('search-flash');

    const timer = window.setTimeout(() => {
      highlightTarget.classList.remove('search-flash');
    }, 1200);

    return () => {
      window.clearTimeout(timer);
      highlightTarget.classList.remove('search-flash');
    };
  }, [activeSearchResult, filteredMessages]);

  // 当切换到另外一个文件时，重置卡片展开状态，避免上一个文件的展开/折叠状态污染新文件的展示
  useEffect(() => {
    if (!selectedFileId) return;
    collapseAll();
  }, [selectedFileId, collapseAll]);

  const resolveExpandedState = (cardId: string) => {
    const state = expandedCards[cardId];
    if (typeof state === 'boolean') {
      return state;
    }
    // thinking 卡片默认折叠，其它卡片默认展开
    return cardId.startsWith('thinking-') ? false : true;
  };

  // 快捷键：E 键展开/折叠所有工具卡片，T 键展开/折叠所有 Thinking 卡片
  useKeyboard({
    shortcuts: [
      {
        key: 'e',
        handler: () => {
          // 获取所有有工具调用的消息ID
          const toolMessageIds = filteredMessages
            .filter(m => m.toolCalls && m.toolCalls.length > 0)
            .map(m => `tool-${m.id}`);

          if (toolMessageIds.length === 0) return;

          // 检查是否有任何工具卡片已展开
          const anyExpanded = toolMessageIds.some(id => resolveExpandedState(id));

          if (anyExpanded) {
            // 如果有展开的，折叠所有
            collapseCards(toolMessageIds);
          } else {
            // 如果全部折叠，展开所有
            expandAll(toolMessageIds);
          }
        },
        description: '展开/折叠所有工具卡片',
      },
      {
        key: 't',
        handler: () => {
          // 获取所有有 Thinking 内容的消息ID
          const thinkingMessageIds = filteredMessages
            .filter(m => m.thinkingContent)
            .map(m => `thinking-${m.id}`);

          if (thinkingMessageIds.length === 0) return;

          // 检查是否有任何 Thinking 卡片已展开
          const anyExpanded = thinkingMessageIds.some(id => resolveExpandedState(id));

          if (anyExpanded) {
            // 如果有展开的，折叠所有
            collapseCards(thinkingMessageIds);
          } else {
            // 如果全部折叠，展开所有
            expandAll(thinkingMessageIds);
          }
        },
        description: '展开/折叠所有 Thinking 卡片',
      },
    ],
    enabled: currentMessages.length > 0,
  });

  // 计算当前视口内的锚点（顶部可见的消息卡片）
  const getTopVisibleMessageId = useCallback((): string | null => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>('[data-message-id]')
    );
    if (cards.length === 0) return null;

    // 选取第一个仍在视口内的卡片；如果都在上方，则取最后一个
    let fallback: string | null = null;
    for (const el of cards) {
      const rect = el.getBoundingClientRect();
      if (!fallback) {
        fallback = el.dataset.messageId ?? null;
      }
      if (rect.bottom < 0) {
        // 完全在上方，继续找
        continue;
      }
      return el.dataset.messageId ?? fallback;
    }
    return fallback;
  }, []);

  // 刷新后滚动回锚点
  const scrollToMessageId = useCallback((messageId: string) => {
    if (!messageId) return;
    const escapedId =
      typeof CSS !== 'undefined' && CSS.escape
        ? CSS.escape(messageId)
        : messageId.replace(/"/g, '\\"');

    const tryScroll = (attempt = 0) => {
      const el = document.querySelector<HTMLElement>(
        `[data-message-id="${escapedId}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        return;
      }
      if (attempt < 3) {
        window.setTimeout(() => tryScroll(attempt + 1), 50);
      }
    };

    window.requestAnimationFrame(() => tryScroll());
  }, []);

  // 刷新当前文件，追加最新内容
  const handleRefresh = useCallback(() => {
    if (!selectedFileId || isMessageLoading) return;
    const anchorId = getTopVisibleMessageId();
    void (async () => {
      const mode = await refreshFile(selectedFileId);
      if (mode === 'full' && anchorId) {
        scrollToMessageId(anchorId);
      }
    })();
  }, [refreshFile, selectedFileId, isMessageLoading, getTopVisibleMessageId, scrollToMessageId]);

  // 自动刷新定时器
  useEffect(() => {
    // 清除旧的定时器
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }

    // 如果开启自动刷新且有选中文件，设置定时器
    if (autoRefresh && selectedFileId) {
      autoRefreshTimerRef.current = window.setInterval(() => {
        handleRefresh();
      }, 10000); // 10秒
    }

    // 清理函数
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, selectedFileId, handleRefresh]);

  // 切换自动刷新状态
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // 文件信息栏
  const fileInfo = selectedFile ? (
    <div className="flex justify-between items-center w-full gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-text-primary truncate">
          {selectedFile.fileName.split('-')[0]} ({currentMessages.length})
        </h2>
      </div>
      <div className="flex-shrink-0">
        <SearchBar />
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {stats && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleStatsPanel}
          >
            📊 统计
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={!selectedFileId || isMessageLoading}
        >
          刷新
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAutoRefresh}
          disabled={!selectedFileId}
          className={autoRefresh ? 'text-accent-cyan' : ''}
        >
          自动刷新
        </Button>
      </div>
    </div>
  ) : null;

  // 消息卡片 - 使用新的 MessageCard 组件
  const messages = currentMessages.length > 0 ? (
    <div className="space-y-6">
      {filteredMessages.length > 0 ? (
        filteredMessages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            messageIndex={message.sessionIndex}
            searchQuery={searchQuery}
          />
        ))
      ) : (
        <SimpleEmptyState
          emoji="🔍"
          title="未找到匹配的消息"
          description="尝试使用其他关键词"
        />
      )}
    </div>
  ) : selectedFileId ? (
    <SimpleEmptyState
      emoji="⏳"
      title="正在加载消息..."
    />
  ) : (
    <SimpleEmptyState
      emoji="👈"
      title="请从左侧选择文件"
      description="选择一个文件以查看对话历史"
    />
  );

  return (
    <>
      <MainLayout
        sidebar={
          <Sidebar
            fileList={<FileList />}
          />
        }
        content={
          <MessagePanel
            fileInfo={fileInfo}
            messages={messages}
          />
        }
      />

      {/* 统计信息弹窗 */}
      <Dialog
        open={isStatsPanelExpanded}
        onClose={toggleStatsPanel}
        title="📊 会话统计"
        width="450px"
      >
        {stats && <StatsPanel stats={stats} />}
      </Dialog>
    </>
  );
}

export default App;
