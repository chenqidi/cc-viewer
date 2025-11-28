import { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // 使用 Tomorrow Night 主题（接近 Spacegray）

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
}

export function CodeBlock({
  code,
  language = 'text',
  showLineNumbers = true,
  className = '',
}: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  // 检测语言
  const detectedLanguage = language || 'text';
  const validLanguage = Prism.languages[detectedLanguage] ? detectedLanguage : 'text';
  // 只有当有有效语言且不是 'text' 时才显示标签
  const showLanguageLabel = validLanguage && validLanguage !== 'text';

  return (
    <div className={`relative ${className}`}>
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

      {/* 语言标签 - 在代码块外部右下角 */}
      {showLanguageLabel && (
        <div className="flex justify-end mt-1">
          <div className="text-xs text-text-muted font-mono px-2 py-0.5 border border-border rounded-sm" style={{ backgroundColor: '#2d2d2d' }}>
            {validLanguage}
          </div>
        </div>
      )}
    </div>
  );
}
