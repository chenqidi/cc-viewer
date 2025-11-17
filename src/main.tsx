import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { applyTheme, DEFAULT_THEME_ID } from "./theme";

// 在 React 渲染之前注入默认主题，确保首次绘制颜色正确
applyTheme(DEFAULT_THEME_ID);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
