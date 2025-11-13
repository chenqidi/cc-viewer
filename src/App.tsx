import { useMemo, useEffect } from "react";
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
import { useUiStore } from "./stores/uiStore";
import { calculateStats } from "./lib/stats";
import { useKeyboard } from "./hooks/useKeyboard";

function App() {
  const { selectedFileId, currentMessages, files } = useFileStore();
  const { searchQuery, setSearchResults, expandedCards, expandAll, collapseAll, isStatsPanelExpanded, toggleStatsPanel } = useUiStore();

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

  // 更新搜索结果到 store
  useEffect(() => {
    const results = filteredMessages.map(m => m.id);
    setSearchResults(results);
  }, [filteredMessages, setSearchResults]);

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
          const anyExpanded = toolMessageIds.some(id => expandedCards.has(id));

          if (anyExpanded) {
            // 如果有展开的，折叠所有
            collapseAll();
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
          const anyExpanded = thinkingMessageIds.some(id => expandedCards.has(id));

          if (anyExpanded) {
            // 如果有展开的，折叠所有
            collapseAll();
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
        <Button variant="ghost" size="sm">刷新</Button>
        <Button variant="ghost" size="sm">导出</Button>
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
