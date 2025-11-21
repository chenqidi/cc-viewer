import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { SessionFile, ParsedMessage, ProjectInfo } from '../types/app';
import { parseJsonlFile } from '../lib/parser';

interface FileStore {
  // 状态
  files: SessionFile[];
  projects: ProjectInfo[];  // 新增：存储项目分组信息
  currentDirectory: string | null;
  selectedFileId: string | null;
  currentMessages: ParsedMessage[];
  isFileListLoading: boolean;
  isMessageLoading: boolean;
  error: string | null;

  // Actions
  loadFiles: (directory: string) => Promise<void>;
  selectFile: (fileId: string) => Promise<void>;
  refreshFile: (fileId: string) => Promise<'full' | 'append' | null>;
  clearSelection: () => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  projects: [],
  currentDirectory: null,
  selectedFileId: null,
  currentMessages: [],
  isFileListLoading: false,
  isMessageLoading: false,
  error: null,

  loadFiles: async (directory: string) => {
    set({ isFileListLoading: true, error: null });

    try {
      // 调用 Tauri 命令，返回 ProjectInfo[]
      const projectInfos = await invoke<ProjectInfo[]>('list_jsonl_files', {
        directory,
      });

      // 将 ProjectInfo[] 转换为 SessionFile[]
      const files: SessionFile[] = [];

      projectInfos.forEach((project) => {
        project.files.forEach((fileInfo) => {
          files.push({
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

      set({ files, projects: projectInfos, currentDirectory: directory, isFileListLoading: false });
    } catch (error) {
      set({ error: String(error), isFileListLoading: false });
    }
  },

  selectFile: async (fileId: string) => {
    const file = get().files.find(f => f.id === fileId);
    if (!file) return;

    // 切换文件时先清空当前消息，避免旧文件内容在加载过程中短暂残留
    set({
      isMessageLoading: true,
      selectedFileId: fileId,
      currentMessages: [],
      error: null,
    });

    try {
      // 读取文件内容
      const content = await invoke<string>('read_file_content', {
        filePath: file.filePath,
      });

      // 解析 JSONL
      const messages = parseJsonlFile(content);

      // 更新文件的消息数量
      const updatedFiles = get().files.map(f =>
        f.id === fileId
          ? {
              ...f,
              messageCount: messages.length,
              firstTimestamp: messages[0]?.timestamp.toISOString() || '',
              lastTimestamp: messages[messages.length - 1]?.timestamp.toISOString() || '',
            }
          : f
      );

      set({
        currentMessages: messages,
        files: updatedFiles,
        isMessageLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isMessageLoading: false });
    }
  },

  refreshFile: async (fileId: string) => {
    const { files, currentMessages, selectedFileId } = get();
    const file = files.find(f => f.id === fileId);
    if (!file) return null;

    // 刷新时保留当前内容，只追加增量
    set({ isMessageLoading: true, error: null });

    try {
      const content = await invoke<string>('read_file_content', {
        filePath: file.filePath,
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

      const updatedFiles = get().files.map(f =>
        f.id === fileId
          ? {
              ...f,
              messageCount: messages.length,
              firstTimestamp: messages[0]?.timestamp.toISOString() || '',
              lastTimestamp: messages[messages.length - 1]?.timestamp.toISOString() || '',
            }
          : f
      );

      set({
        currentMessages: nextMessages,
        files: updatedFiles,
        isMessageLoading: false,
      });

      return shouldAppend ? 'append' : 'full';
    } catch (error) {
      set({ error: String(error), isMessageLoading: false });
      return null;
    }
  },

  clearSelection: () => {
    set({ selectedFileId: null, currentMessages: [] });
  },
}));
