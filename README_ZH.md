# Chainy Web – React 前端介面

Chainy Web 是 Chainy URL 縮短服務的前端 React 應用程式，使用 Vite 建置工具和 Tailwind CSS 樣式框架。

## 專案特色

- ⚡ **Vite** - 快速的開發建置工具
- ⚛️ **React 18** - 現代化的 React 框架
- 🎨 **Tailwind CSS** - 實用優先的 CSS 框架
- 🔍 **ESLint** - 代碼品質檢查
- 📱 **響應式設計** - 支援各種裝置尺寸

## 技術棧

- **前端框架**: React 18
- **建置工具**: Vite
- **樣式框架**: Tailwind CSS
- **代碼檢查**: ESLint
- **包管理**: npm

## 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

應用程式將在 `http://localhost:5173` 啟動，並支援熱重載。

### 建置生產版本

```bash
npm run build
```

建置檔案將輸出到 `dist/` 目錄。

### 預覽生產版本

```bash
npm run preview
```

## 專案結構

```
src/
├── App.jsx          # 主應用程式組件
├── App.css          # 應用程式樣式
├── main.jsx         # 應用程式入口點
├── index.css        # 全域樣式
├── styles.css       # 自定義樣式
└── assets/          # 靜態資源
    └── react.svg
```

## 開發指南

### 代碼風格

專案使用 ESLint 進行代碼檢查，請確保代碼符合規範：

```bash
npm run lint
```

### 樣式開發

使用 Tailwind CSS 進行樣式開發，支援：

- 響應式設計斷點
- 深色/淺色主題
- 自定義組件樣式

### 組件開發

建議的組件結構：

```jsx
// 組件檔案
import React from "react";

const ComponentName = ({ prop1, prop2 }) => {
  return <div className="tailwind-classes">{/* 組件內容 */}</div>;
};

export default ComponentName;
```

## 與後端整合

此前端應用程式設計與 Chainy 後端 API 整合：

- **API 端點**: 透過環境變數配置
- **認證**: 支援 JWT 或 OAuth 流程
- **錯誤處理**: 統一的錯誤處理機制

## 部署

### 靜態部署

建置後的檔案可以部署到任何靜態檔案伺服器：

- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

### 環境變數

建立 `.env` 檔案配置環境變數：

```env
VITE_API_BASE_URL=https://your-api-endpoint.com
VITE_APP_NAME=Chainy
```

## 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 授權

此專案採用 MIT 授權條款。
