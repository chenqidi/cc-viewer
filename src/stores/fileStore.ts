import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { SessionFile, ParsedMessage, ProjectInfo } from '../types/app';
import { parseJsonlFile } from '../lib/parser';

interface FileStore {
  // 文件列表状态（独立更新，不影响消息内容）
  files: SessionFile[];
  projects: ProjectInfo[];
  currentDirectory: string | null;
  isFileListLoading: boolean;

  // 消息内容状态（独立更新，不影响文件列表）
  selectedFileId: string | null;
  selectedFilePath: string | null;  // 缓存选中文件路径，避免依赖 files 查找
  currentMessages: ParsedMessage[];
  isMessageLoading: boolean;

  // 共享错误状态
  error: string | null;

  // Actions
  loadFiles: (directory: string) => Promise<void>;
  selectFile: (fileId: string) => Promise<void>;
  refreshFile: (fileId: string) => Promise<'full' | 'append' | null>;
  clearSelection: () => void;
}

/**
 * 比较两个文件数组是否相同（浅比较关键字段）
 */
function areFilesEqual(a: SessionFile[], b: SessionFile[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].id !== b[i].id ||
      a[i].filePath !== b[i].filePath ||
      a[i].fileSize !== b[i].fileSize ||
      a[i].firstTimestamp !== b[i].firstTimestamp
    ) {
      return false;
    }
  }
  return true;
}

/**
 * 比较两个项目数组是否相同
 */
function areProjectsEqual(a: ProjectInfo[], b: ProjectInfo[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].project_name !== b[i].project_name ||
      a[i].cwd !== b[i].cwd ||
      a[i].last_modified !== b[i].last_modified ||
      a[i].files.length !== b[i].files.length
    ) {
      return false;
    }
  }
  return true;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  projects: [],
  currentDirectory: null,
  isFileListLoading: false,
  selectedFileId: null,
  selectedFilePath: null,
  currentMessages: [],
  isMessageLoading: false,
  error: null,

  loadFiles: async (directory: string) => {
    set({ isFileListLoading: true });

    try {
      const projectInfos = await invoke<ProjectInfo[]>('list_jsonl_files', {
        directory,
      });

      // 将 ProjectInfo[] 转换为 SessionFile[]
      const newFiles: SessionFile[] = [];

      projectInfos.forEach((project) => {
        project.files.forEach((fileInfo) => {
          newFiles.push({
            id: fileInfo.name.replace('.jsonl', ''),
            filePath: fileInfo.path,
            fileName: fileInfo.name,
            fileSize: fileInfo.size,
            messageCount: 0,
            firstTimestamp: new Date(fileInfo.modified).toISOString(),
            lastTimestamp: new Date(fileInfo.modified).toISOString(),
            records: [],
          });
        });
      });

      const { files: oldFiles, projects: oldProjects } = get();

      // 只有当文件列表或项目真正变化时才更新，避免不必要的重渲染
      const filesChanged = !areFilesEqual(oldFiles, newFiles);
      const projectsChanged = !areProjectsEqual(oldProjects, projectInfos);

      if (filesChanged || projectsChanged) {
        set({
          files: filesChanged ? newFiles : oldFiles,
          projects: projectsChanged ? projectInfos : oldProjects,
          currentDirectory: directory,
          isFileListLoading: false,
        });
      } else {
        set({ currentDirectory: directory, isFileListLoading: false });
      }
    } catch (error) {
      set({ error: String(error), isFileListLoading: false });
    }
  },

  selectFile: async (fileId: string) => {
    const file = get().files.find(f => f.id === fileId);
    if (!file) return;

    // 切换文件时先清空当前消息，避免旧文件内容在加载过程中短暂残留
    // 同时缓存文件路径，后续刷新时不再依赖 files 数组
    set({
      isMessageLoading: true,
      selectedFileId: fileId,
      selectedFilePath: file.filePath,
      currentMessages: [],
      error: null,
    });

    try {
      const content = await invoke<string>('read_file_content', {
        filePath: file.filePath,
      });

      const messages = parseJsonlFile(content);

      // 只更新消息内容，不更新 files 数组
      set({
        currentMessages: messages,
        isMessageLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isMessageLoading: false });
    }
  },

  refreshFile: async (fileId: string) => {
    const { selectedFilePath, currentMessages, selectedFileId } = get();

    // 使用缓存的文件路径，不依赖 files 数组
    if (!selectedFilePath || selectedFileId !== fileId) return null;

    // 刷新时保留当前内容，只追加增量
    set({ isMessageLoading: true, error: null });

    try {
      const content = await invoke<string>('read_file_content', {
        filePath: selectedFilePath,
      });

      const messages = parseJsonlFile(content);

      // 如果是当前选中的文件，并且文件只追加了内容，增量追加，避免整页重渲染
      const hasSamePrefix = currentMessages.every(
        (msg, index) => messages[index]?.id === msg.id
      );

      const detectToolMergeChange = (): boolean => {
        for (let i = 0; i < currentMessages.length; i++) {
          const prev = currentMessages[i];
          const next = messages[i];
          if (!next) return true;

          // pairedToolResultIndex 或 indexLabel 变化意味着需要全量刷新
          if (prev.pairedToolResultIndex !== next.pairedToolResultIndex) return true;
          if (prev.indexLabel !== next.indexLabel) return true;

          const prevCalls = prev.toolCalls || [];
          const nextCalls = next.toolCalls || [];
          if (prevCalls.length !== nextCalls.length) return true;

          for (let j = 0; j < prevCalls.length; j++) {
            const p = prevCalls[j];
            const n = nextCalls[j];
            // 以 id 优先匹配；若缺失 id，按顺序比对
            if (p.id && n.id && p.id !== n.id) return true;
            if (p.result !== n.result) return true;
            if (p.name !== n.name) return true;
          }
        }
        return false;
      };

      const hasToolMergeChange = detectToolMergeChange();

      const shouldAppend =
        selectedFileId === fileId &&
        hasSamePrefix &&
        messages.length >= currentMessages.length &&
        !hasToolMergeChange;

      const appendedMessages = shouldAppend
        ? messages.slice(currentMessages.length)
        : messages;

      const nextMessages = shouldAppend
        ? [...currentMessages, ...appendedMessages]
        : messages;

      // 只更新消息内容，不更新 files 数组
      set({
        currentMessages: nextMessages,
        isMessageLoading: false,
      });

      return shouldAppend ? 'append' : 'full';
    } catch (error) {
      set({ error: String(error), isMessageLoading: false });
      return null;
    }
  },

  clearSelection: () => {
    set({ selectedFileId: null, selectedFilePath: null, currentMessages: [] });
  },
}));
