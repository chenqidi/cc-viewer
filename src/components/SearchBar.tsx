import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { useUiStore } from '../stores/uiStore';

export function SearchBar() {
  const { searchQuery, searchResults, setSearchQuery, clearSearch } = useUiStore();
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

      {/* 搜索结果计数 */}
      {searchQuery && searchResults.length > 0 && (
        <div className="text-xs text-text-secondary whitespace-nowrap">
          <span className="font-semibold text-accent-cyan">{searchResults.length}</span> 条匹配
        </div>
      )}
    </div>
  );
}
