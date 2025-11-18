import { useEffect, useRef, useState } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';
import { useUiStore } from '../stores/uiStore';

export function SearchBar() {
  const {
    searchQuery,
    searchResults,
    activeSearchResultIndex,
    setSearchQuery,
    clearSearch,
    setActiveSearchResult,
    setActiveSearchResultIndex,
  } = useUiStore();
  const [inputValue, setInputValue] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // 快捷键支持 (Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F 或 Cmd+F (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }

      // Esc 键清除搜索
      if (e.key === 'Escape' && inputRef.current === document.activeElement) {
        handleClear();
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = () => {
    setSearchQuery(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // 实时搜索（输入时自动触发搜索）
    if (value.trim()) {
      setSearchQuery(value.trim());
    } else {
      clearSearch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasSearchQuery = Boolean(searchQuery.trim());
  const totalResults = searchResults.length;
  const hasResults = hasSearchQuery && totalResults > 0;
  const currentResultDisplay =
    hasResults && activeSearchResultIndex >= 0 ? activeSearchResultIndex + 1 : 0;

  const goToNextResult = () => {
    if (!hasResults) return;
    const nextIndex =
      activeSearchResultIndex === -1
        ? 0
        : (activeSearchResultIndex + 1) % totalResults;
    setActiveSearchResultIndex(nextIndex);
  };

  const goToPreviousResult = () => {
    if (!hasResults) return;
    if (activeSearchResultIndex === -1) {
      setActiveSearchResultIndex(totalResults - 1);
      return;
    }
    const nextIndex =
      (activeSearchResultIndex - 1 + totalResults) % totalResults;
    setActiveSearchResultIndex(nextIndex);
  };

  useEffect(() => {
    if (!hasSearchQuery || !hasResults || activeSearchResultIndex === -1) {
      setActiveSearchResult(null);
      return;
    }

    const targetResult = searchResults[activeSearchResultIndex];
    if (targetResult) {
      setActiveSearchResult(targetResult);
    }
  }, [
    hasResults,
    hasSearchQuery,
    activeSearchResultIndex,
    searchResults,
    setActiveSearchResult,
  ]);

  return (
    <div className="flex items-center gap-2">
      {/* 搜索输入框 */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="搜索消息... (Ctrl+F)"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="pl-9 pr-9 w-full"
        />
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            title="清除搜索 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 搜索结果计数与跳转 */}
      {hasSearchQuery && (
        <div className="flex items-center gap-2 text-xs text-text-secondary whitespace-nowrap">
          {hasResults ? (
            <span className="flex items-center gap-1">
              <span className="font-semibold text-accent-cyan">
                {currentResultDisplay}
              </span>
              <span>/</span>
              <span>{totalResults}</span>
            </span>
          ) : (
            <span>0 条匹配</span>
          )}
          <div className="flex flex-col border border-border-subtle rounded-md overflow-hidden h-10">
            <button
              type="button"
              onClick={goToPreviousResult}
              disabled={!hasResults}
              className="flex-1 flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed border-b border-border-subtle/60 last:border-b-0"
              title="跳转到上一个匹配"
            >
              <ChevronUp className="w-4 h-4 text-accent-cyan" />
            </button>
            <button
              type="button"
              onClick={goToNextResult}
              disabled={!hasResults}
              className="flex-1 flex items-center justify-center hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed"
              title="跳转到下一个匹配"
            >
              <ChevronDown className="w-4 h-4 text-accent-cyan" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
