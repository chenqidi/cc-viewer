import { useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useFileStore } from '../stores/fileStore';
import { useUiStore } from '../stores/uiStore';
import { ProjectGroup } from './ProjectGroup';
import { LoadingSkeleton } from './ui/loading';
import { ErrorAlert } from './ui/error';
import { EmptyState } from './ui/empty-state';

export function FileList() {
  const {
    files,
    projects,
    selectedFileId,
    isFileListLoading,
    isMessageLoading,
    error,
    loadFiles,
    selectFile,
  } = useFileStore();
  const { fileSearchQuery } = useUiStore();

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
    const groups = projects.map((project) => {
      // 从 files 中找到属于这个项目的所有 SessionFile
      const projectFiles = files.filter((file) =>
        project.files.some((pf) => pf.path === file.filePath)
      );

      return {
        projectName: project.project_name,
        projectCwd: project.cwd,
        files: projectFiles,
        lastModified: project.last_modified,
      };
    });

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
  }, [projects, files, fileSearchQuery]);

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

  // 空状态
  if (projects.length === 0) {
    return (
      <div className="pb-2 pt-0">
        <EmptyState type="no-files" />
      </div>
    );
  }

  // 项目分组列表
  return (
    <div className="pb-2 pt-0">
      {projectGroups.map((group) => (
        <ProjectGroup
          key={group.projectCwd}
          projectName={group.projectName}
          projectCwd={group.projectCwd}
          files={group.files}
          lastModified={group.lastModified}
          selectedFileId={selectedFileId}
          isLoading={isMessageLoading}
          onSelectFile={selectFile}
        />
      ))}
    </div>
  );
}
