# Claude Code History Viewer

一个用于可视化查看 Claude Code 历史对话记录的跨平台桌面应用。

## 技术栈

- **桌面框架**: Tauri 2.0
- **前端框架**: React 18 + TypeScript
- **UI 库**: shadcn/ui + Tailwind CSS
- **构建工具**: Vite
- **状态管理**: Zustand
- **代码高亮**: Prism.js
- **Markdown 渲染**: react-markdown

## 项目结构

```
cc-viewer/
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── main.rs        # 入口文件
│   │   └── commands.rs    # Tauri 命令
│   └── Cargo.toml
│
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   └── ui/            # 基础 UI 组件
│   ├── stores/            # Zustand 状态管理
│   ├── types/             # TypeScript 类型定义
│   ├── lib/               # 工具函数
│   ├── styles/            # 样式文件
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri:dev
```

这将启动:
1. Vite 开发服务器 (http://localhost:1420)
2. Tauri 窗口

### 构建应用

```bash
npm run tauri:build
```

## 功能特性

### 已实现
✅ 项目基础结构搭建
✅ Tauri + React + TypeScript 配置
✅ Tailwind CSS + Neo-Brutalism 样式
✅ 基础 UI 组件 (Button, Card, Input)
✅ TypeScript 类型定义
✅ Zustand 状态管理
✅ 工具函数库

### 待实现
- [ ] 文件列表展示
- [ ] 消息卡片渲染
- [ ] Markdown 渲染和代码高亮
- [ ] 搜索功能
- [ ] 统计面板
- [ ] 导出功能

## 配色方案

项目使用 Spacegray Eighties 配色方案:

- 背景: `#2B2B2B`
- 卡片: `#353535`
- 文本: `#D3D0C8`
- 强调色: Cyan, Pink, Yellow, Blue, Green, Orange, Purple

## 开发进度

详见 [SPEC.md](./SPEC.md) 文件中的开发实施计划。

## License

MIT
