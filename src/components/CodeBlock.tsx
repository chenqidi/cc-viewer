import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // 使用 Tomorrow Night 主题（接近 Spacegray）
import { Button } from './ui/button';

// 导入常用语言支持
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
  // 是否显示顶部语言标签和“复制代码”按钮
  showHeader?: boolean;
}

export function CodeBlock({
  code,
  language = 'text',
  showLineNumbers = true,
  className = '',
  showHeader = true,
}: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  // 检测语言
  const detectedLanguage = language || 'text';
  const validLanguage = Prism.languages[detectedLanguage] ? detectedLanguage : 'text';

  return (
    <div className={`relative group ${className}`}>
      {/* 语言标签和复制按钮 */}
      {showHeader && (
        <div className="flex items-center justify-between bg-[#272E36] px-4 py-2 border-b-2 border-border">
          <span className="text-xs text-text-secondary uppercase font-mono">
            {validLanguage}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            复制代码
          </Button>
        </div>
      )}

      {/* 代码块 */}
      <div className="overflow-x-auto">
        <pre
          className={`!m-0 ${showLineNumbers ? 'line-numbers' : ''} language-${validLanguage}`}
        >
          <code
            ref={codeRef}
            className={`language-${validLanguage}`}
          >
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
