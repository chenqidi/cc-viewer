import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useUiStore } from '../stores/uiStore';

export function SidebarSearch() {
  const { fileSearchQuery, setFileSearchQuery, clearFileSearch } = useUiStore();
  const [isSearchMode, setIsSearchMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 切换到搜索模式时自动聚焦
  useEffect(() => {
    if (isSearchMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchMode]);

  // 进入搜索模式
  const enterSearchMode = () => {
    setIsSearchMode(true);
  };

  // 退出搜索模式
  const exitSearchMode = () => {
    setIsSearchMode(false);
    clearFileSearch();
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileSearchQuery(e.target.value);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      exitSearchMode();
    }
  };

  // 处理失焦
  const handleBlur = () => {
    // 如果没有输入内容，退出搜索模式
    if (!fileSearchQuery.trim()) {
      exitSearchMode();
    }
  };

  // 清除搜索
  const handleClear = () => {
    clearFileSearch();
    inputRef.current?.focus();
  };

  // 搜索模式
  if (isSearchMode) {
    return (
      <div className="flex-shrink-0 h-16 px-4 flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索项目或文件..."
            value={fileSearchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="w-full h-10 leading-10 pl-9 pr-9 py-0 brutal-border rounded-brutal bg-background text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          />
          {fileSearchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              title="清除搜索"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 默认模式
  return (
    <div className="flex-shrink-0 h-16 px-4 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-accent-cyan">
        CC Viewer
      </h1>
      <button
        onClick={enterSearchMode}
        className="p-2 text-text-secondary hover:text-text-primary hover:bg-card-user rounded-brutal transition-colors"
        title="搜索文件"
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  );
}
