import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { SessionFile, ParsedMessage, ProjectInfo } from '../types/app';
import { parseJsonlFile } from '../lib/parser';

interface FileStore {
  // 状态
  files: SessionFile[];
  projects: ProjectInfo[];  // 新增：存储项目分组信息
  selectedFileId: string | null;
  currentMessages: ParsedMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFiles: (directory: string) => Promise<void>;
  selectFile: (fileId: string) => Promise<void>;
  refreshFile: (fileId: string) => Promise<void>;
  clearSelection: () => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  projects: [],
  selectedFileId: null,
  currentMessages: [],
  isLoading: false,
  error: null,

  loadFiles: async (directory: string) => {
    set({ isLoading: true, error: null });

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

      set({ files, projects: projectInfos, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  selectFile: async (fileId: string) => {
    const file = get().files.find(f => f.id === fileId);
    if (!file) return;

    set({ isLoading: true, selectedFileId: fileId, error: null });

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
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  refreshFile: async (fileId: string) => {
    await get().selectFile(fileId);
  },

  clearSelection: () => {
    set({ selectedFileId: null, currentMessages: [] });
  },
}));
