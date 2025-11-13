import { ReactNode } from 'react';
import { SidebarSearch } from '../SidebarSearch';

interface SidebarProps {
  fileList?: ReactNode;
}

export function Sidebar({ fileList }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* 品牌标识 + 搜索 */}
      <SidebarSearch />

      {/* 文件列表区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {fileList ? (
          fileList
        ) : (
          <div className="p-4 text-center text-text-secondary">
            <p className="text-sm">暂无文件</p>
          </div>
        )}
      </div>
    </div>
  );
}
