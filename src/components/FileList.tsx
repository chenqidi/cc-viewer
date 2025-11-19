import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { homeDir } from '@tauri-apps/api/path';
import { ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { useFileStore } from '../stores/fileStore';
import { useUiStore } from '../stores/uiStore';
import { ProjectGroup } from './ProjectGroup';
import { LoadingSkeleton } from './ui/loading';
import { ErrorAlert } from './ui/error';
import { EmptyState } from './ui/empty-state';

const DEFAULT_ROOT_DISPLAY = '~/.claude/projects';
const PROJECT_INDENT_PX = 38;
const FILE_ITEM_EXTRA_INDENT_PX = 22;
const AGENT_FILTER_STORAGE_KEY = 'cc-viewer:filter-agent-files';

export function FileList() {
  const {
    files,
    projects,
    currentDirectory,
    selectedFileId,
    isFileListLoading,
    isMessageLoading,
    error,
    loadFiles,
    selectFile,
  } = useFileStore();
  const { fileSearchQuery } = useUiStore();
  const [isRootExpanded, setIsRootExpanded] = useState(false);
  const [resolvedHomeDir, setResolvedHomeDir] = useState<string | null>(null);
  const [isAgentFilterEnabled, setIsAgentFilterEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(AGENT_FILTER_STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(AGENT_FILTER_STORAGE_KEY, isAgentFilterEnabled ? 'true' : 'false');
  }, [isAgentFilterEnabled]);

  useEffect(() => {
    let isMounted = true;

    void homeDir()
      .then((dir) => {
        if (isMounted) {
          setResolvedHomeDir(dir);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResolvedHomeDir(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 初始化：加载默认目录的文件列表
  useEffect(() => {
    const initFiles = async () => {
      try {
        const defaultDir = await invoke<string>('get_default_claude_dir');
        await loadFiles(defaultDir);
      } catch (err) {
        console.error('Failed to load files:', err);
      }
    };

    initFiles();
  }, [loadFiles]);

  // 将 ProjectInfo 转换为 ProjectGroup 的数据格式
  // 注意：useMemo 必须在所有条件返回之前调用，遵循 Hooks 规则
  const projectGroups = useMemo(() => {
    const groups = projects
      .map((project) => {
        // 从 files 中找到属于这个项目的所有 SessionFile
        const projectFiles = files.filter((file) =>
          project.files.some((pf) => pf.path === file.filePath)
        );

        const visibleFiles = isAgentFilterEnabled
          ? projectFiles.filter((file) => !file.fileName.toLowerCase().startsWith('agent-'))
          : projectFiles;

        if (visibleFiles.length === 0) {
          return null;
        }

        return {
          projectName: project.project_name,
          projectCwd: project.cwd,
          files: visibleFiles,
          lastModified: project.last_modified,
          isRootLevel: project.is_root_level,
        };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);

    // 如果没有搜索查询，返回所有项目组
    if (!fileSearchQuery.trim()) {
      return groups;
    }

    // 过滤逻辑
    const query = fileSearchQuery.toLowerCase();
    const filteredGroups = groups
      .map((group) => {
        // 检查项目名是否匹配
        const projectNameMatches = group.projectName.toLowerCase().includes(query);

        // 如果项目名匹配，返回整个项目组
        if (projectNameMatches) {
          return group;
        }

        // 项目名不匹配，检查文件名是否匹配
        const matchedFiles = group.files.filter((file) =>
          file.fileName.toLowerCase().includes(query)
        );

        // 如果有匹配的文件，返回只包含匹配文件的项目组
        if (matchedFiles.length > 0) {
          return {
            ...group,
            files: matchedFiles,
          };
        }

        // 项目名和文件名都不匹配，返回 null
        return null;
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);

    return filteredGroups;
  }, [projects, files, fileSearchQuery, isAgentFilterEnabled]);

  const hasOnlyRootProject = projects.length === 1 && projects[0]?.is_root_level;
  const flatProjectGroup = hasOnlyRootProject ? projectGroups[0] : undefined;
  const flatProjectFiles = flatProjectGroup?.files ?? [];

  // 加载状态
  if (isFileListLoading && files.length === 0) {
    return (
      <div className="pb-2 pt-0">
        <LoadingSkeleton rows={3} />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="pb-2 pt-0">
        <ErrorAlert
          type="error"
          title="加载失败"
          message={error}
          onClose={async () => {
            try {
              const defaultDir = await invoke<string>('get_default_claude_dir');
              await loadFiles(defaultDir);
            } catch (err) {
              console.error('Retry failed:', err);
            }
          }}
        />
      </div>
    );
  }

  const rootFormattedPath = currentDirectory
    ? formatDirectoryForDisplay(currentDirectory, resolvedHomeDir)
    : DEFAULT_ROOT_DISPLAY;
  const rootDisplayName = extractDisplayName(rootFormattedPath);

  const rootSummary = (() => {
    if (hasOnlyRootProject) {
      if (flatProjectFiles.length > 0) {
        return `${flatProjectFiles.length} 个文件`;
      }
      if (fileSearchQuery.trim()) {
        return '没有匹配的文件';
      }
      return isAgentFilterEnabled ? '过滤后无可用文件' : '无可用文件';
    }

    if (projectGroups.length > 0) {
      return `${projectGroups.length} 个项目`;
    }

    if (fileSearchQuery.trim()) {
      return '没有匹配的项目';
    }

    return isAgentFilterEnabled ? '过滤后无可用项目' : '无可用项目';
  })();

  return (
    <div className="pb-2 pt-0">
      <div className="mb-1">
        <div
          className={`w-full flex items-start gap-2 rounded-md transition-colors ${
            isRootExpanded ? 'bg-background-header' : 'hover:bg-background-header'
          }`}
        >
          <button
            type="button"
            onClick={() => setIsRootExpanded(prev => !prev)}
            className="flex-1 min-w-0 px-4 py-2 text-left flex items-start gap-2"
          >
            <span className="text-text-secondary flex-shrink-0 h-5 flex items-center">
              {isRootExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="font-bold text-sm truncate text-text-primary"
                title={currentDirectory ?? DEFAULT_ROOT_DISPLAY}
              >
                {rootDisplayName}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">
                {rootSummary}
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setIsAgentFilterEnabled(prev => !prev)}
            className="p-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0 flex items-center"
            title={
              isAgentFilterEnabled ? '点击显示 agent- 开头的文件' : '点击隐藏 agent- 开头的文件'
            }
            aria-label={
              isAgentFilterEnabled ? '显示 agent- 开头的文件' : '隐藏 agent- 开头的文件'
            }
            aria-pressed={isAgentFilterEnabled}
          >
            <span className="h-5 flex items-center pt-0.5">
              <Eye
                className={`w-4 h-4 ${
                  isAgentFilterEnabled ? 'text-accent-cyan' : 'text-text-secondary'
                }`}
              />
            </span>
          </button>
        </div>

        {isRootExpanded && (
          <div className="pl-[38px]">
            {hasOnlyRootProject ? (
              flatProjectGroup && flatProjectFiles.length > 0 ? (
                <ProjectGroup
                  key={flatProjectGroup.projectCwd}
                  projectName={flatProjectGroup.projectName}
                  projectCwd={flatProjectGroup.projectCwd}
                  files={flatProjectFiles}
                  lastModified={flatProjectGroup.lastModified}
                  selectedFileId={selectedFileId}
                  isLoading={isMessageLoading}
                  onSelectFile={selectFile}
                  indentOffset={PROJECT_INDENT_PX}
                  fileIndentOffset={0}
                  hideHeader
                />
              ) : fileSearchQuery.trim() ? (
                <div className="px-4 py-3 text-sm text-text-secondary">
                  没有匹配的文件
                </div>
              ) : isAgentFilterEnabled ? (
                <div className="px-4 py-3 text-sm text-text-secondary">
                  过滤后无可用文件
                </div>
              ) : (
                <div className="px-4 py-6">
                  <EmptyState type="no-files" />
                </div>
              )
            ) : projectGroups.length > 0 ? (
              projectGroups.map((group) => (
                <ProjectGroup
                  key={group.projectCwd}
                  projectName={group.projectName}
                  projectCwd={group.projectCwd}
                  files={group.files}
                  lastModified={group.lastModified}
                  selectedFileId={selectedFileId}
                  isLoading={isMessageLoading}
                  onSelectFile={selectFile}
                  indentOffset={PROJECT_INDENT_PX}
                  fileIndentOffset={FILE_ITEM_EXTRA_INDENT_PX}
                />
              ))
            ) : fileSearchQuery.trim() ? (
              <div className="px-4 py-3 text-sm text-text-secondary">
                没有匹配的项目
              </div>
            ) : isAgentFilterEnabled ? (
              <div className="px-4 py-3 text-sm text-text-secondary">
                过滤后无可用项目
              </div>
            ) : (
              <div className="px-4 py-6">
                <EmptyState type="no-files" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDirectoryForDisplay(path: string, homeDirectory: string | null) {
  const normalizedPath = normalizePath(path);

  if (homeDirectory) {
    const normalizedHome = normalizePath(homeDirectory);
    if (normalizedPath.startsWith(normalizedHome)) {
      const suffix = normalizedPath.slice(normalizedHome.length);
      if (!suffix) {
        return '~';
      }
      return `~${suffix.startsWith('/') ? '' : '/'}${suffix}`;
    }
  }

  return normalizedPath;
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/');
}

function extractDisplayName(path: string) {
  const normalizedPath = normalizePath(path);
  const parts = normalizedPath.split('/').filter(Boolean);
  if (parts.length === 0) {
    return path;
  }
  return parts[parts.length - 1];
}
