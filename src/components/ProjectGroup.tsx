import { useEffect, useState } from 'react';
import type { SessionFile } from '../types/app';
import { formatDateTime } from '../lib/utils';
import { LoadingSpinner } from './ui/loading';

// 向右箭头图标（折叠状态）
function ChevronRightIcon() {
  return (
    <svg
      width="14px"
      height="14px"
      viewBox="0 0 0.6 0.6"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.216 0.14a0.026 0.026 0 0 0 0 0.036L0.34 0.3 0.216 0.424a0.026 0.026 0 0 0 0.036 0.036L0.394 0.318a0.026 0.026 0 0 0 0 -0.036L0.252 0.14a0.026 0.026 0 0 0 -0.036 0z"
        fill="currentColor"
      />
    </svg>
  );
}

// 向下箭头图标（展开状态）
function ChevronDownIcon() {
  return (
    <svg
      width="14px"
      height="14px"
      viewBox="0 0 0.6 0.6"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.318 0.392a0.026 0.026 0 0 1 -0.036 0L0.14 0.25a0.026 0.026 0 0 1 0.036 -0.036L0.3 0.34 0.424 0.216A0.026 0.026 0 0 1 0.46 0.252z"
        fill="currentColor"
      />
    </svg>
  );
}

interface ProjectGroupProps {
  projectName: string;  // 已经是从 cwd 提取的干净名称（如 "cc-viewer"）
  projectCwd: string;   // 完整的 cwd 路径，用于 hover 显示
  files: SessionFile[];
  lastModified: number; // 最后修改时间（Unix 时间戳，毫秒）
  selectedFileId: string | null;
  isLoading: boolean;
  onSelectFile: (fileId: string) => void;
  indentOffset?: number;
  fileIndentOffset?: number;
  hideHeader?: boolean;
}

export function ProjectGroup({
  projectName,
  projectCwd,
  files,
  lastModified,
  selectedFileId,
  isLoading,
  onSelectFile,
  indentOffset = 0,
  fileIndentOffset = 22,
  hideHeader = false,
}: ProjectGroupProps) {
  const [isExpanded, setIsExpanded] = useState(hideHeader);

  useEffect(() => {
    if (hideHeader) {
      setIsExpanded(true);
    }
  }, [hideHeader]);

  // 计算项目统计信息
  const fileCount = files.length;
  const projectButtonStyle = indentOffset > 0
    ? {
        marginLeft: `-${indentOffset}px`,
        paddingLeft: `${indentOffset}px`,
      }
    : undefined;

  return (
    <div className="mb-[6px]">
      {/* 项目头部 - 简洁模式 */}
      {!hideHeader && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-full px-0 pr-4 py-1.5 text-left transition-colors
            ${isExpanded ? 'bg-background-header' : 'hover:bg-background-header'}
          `}
          style={projectButtonStyle}
        >
          {/* 项目名 + 折叠图标 + 日期信息（时间与项目名左对齐） */}
          <div className="flex items-start gap-2">
            <span className="text-text-secondary flex-shrink-0 h-5 flex items-center">
              {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="font-bold text-sm truncate text-text-primary"
                title={projectCwd}
              >
                {projectName} [{fileCount}]
              </div>
              <div className="text-xs text-text-secondary mt-0.5">
                {formatDateTime(lastModified)}
              </div>
            </div>
          </div>
        </button>
      )}

      {/* 文件列表 */}
      {(isExpanded || hideHeader) && (
        <div>
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              isSelected={file.id === selectedFileId}
              isLoading={isLoading && file.id === selectedFileId}
              onClick={() => onSelectFile(file.id)}
              indentOffset={indentOffset}
              fileIndentOffset={fileIndentOffset}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileItemProps {
  file: SessionFile;
  isSelected: boolean;
  isLoading: boolean;
  onClick: () => void;
  indentOffset: number;
  fileIndentOffset: number;
}

function FileItem({ file, isSelected, isLoading, onClick, indentOffset, fileIndentOffset }: FileItemProps) {
  const totalIndent = indentOffset + fileIndentOffset;
  const fileButtonStyle = {
    marginLeft: indentOffset > 0 ? `-${indentOffset}px` : undefined,
    paddingLeft: totalIndent > 0 ? `${totalIndent}px` : undefined,
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        group w-full pr-4 py-1.5 text-left transition-colors
        flex items-start justify-between gap-2
        ${isSelected ? 'bg-surface-muted' : ''}
        ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      `}
      style={fileButtonStyle}
    >
      <div className="flex-1 min-w-0">
        {/* 文件名 */}
        <div
          className={`text-sm truncate transition-colors ${
            isSelected
              ? 'text-accent-cyan font-semibold'
              : 'text-text-primary font-medium group-hover:text-accent-cyan'
          }`}
          title={file.fileName}
        >
          {file.fileName}
        </div>

        {/* 文件信息 */}
        <div className="text-xs text-text-secondary mt-0.5">
          {formatDateTime(file.lastTimestamp)}
        </div>
      </div>

      {/* 加载指示器 */}
      {isLoading && (
        <div className="flex-shrink-0">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </button>
  );
}
