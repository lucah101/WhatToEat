WhatToEat
=========

WhatToEat 是一个简单的「本周吃什么」规划工具，包含：

- **Food Database**：维护你常用的食材和分类（Carbs / Protein / Vegetables / Soup）
- **Weekly Plan**：按星期 × 三餐拖拽搭配本周的饮食计划，并记录每种食材的克数

前端使用 React + TypeScript 编写，样式为手写 CSS；后端为 ASP.NET（.NET 9）提供 REST API 和持久化。

---

## 开发环境

- Node.js 18+（前端）
- .NET 9 SDK（后端）
- npm / pnpm / yarn（任选其一，下面示例使用 npm）

克隆仓库后，进入项目根目录：

```bash
git clone <your-repo-url>
cd WhatToEat
```

---

## 后端（ASP.NET）启动

后端源码位于 `backend` 目录，默认监听 `http://localhost:5234`。

### 安装依赖并运行

```bash
cd backend
dotnet restore
dotnet run
```

运行成功后，接口大致为：

- `GET  /api/foods`：获取所有食材
- `POST /api/foods`：新增食材
- `PUT  /api/foods/{id}`：修改食材
- `DELETE /api/foods/{id}`：删除食材
- `GET  /api/weekly-plan`：获取整周计划
- `POST /api/weekly-plan`：保存整周计划

保持后端进程常驻，用于本地开发。

---

## 前端（React）启动

前端源码位于 `frontend` 目录，使用 Vite + React + TypeScript，样式全部在 `src/App.css` 中手写完成，不依赖 TailwindCSS。

### 安装依赖

```bash
cd frontend
npm install
```

### 启动开发服务器

```bash
npm run dev
```

在浏览器中访问 Vite 输出的地址（通常是 `http://localhost:5173`），即可看到应用：

- 顶部导航：`Food Database` / `Weekly Plan`
- 左右布局：左侧为可用食材列表，右侧为一周计划表格

前端通过 `http://localhost:5234` 调用后端接口，请确保后端已启动。

---

## 主要功能说明

### Food Database

- 为 4 个内置类别维护食材：`Carbs`、`Protein`、`Vegetables`、`Soup`
- 在每个卡片底部输入名称并点击 `+` 按钮即可新增
- 支持对现有食材进行重命名和删除
- 所有修改会自动同步到后端

### Weekly Plan

- 从左侧的可用食材列表拖动到右侧「星期 × 三餐」表格单元格
- 同一单元格可放多个食材，按类别分组显示（Carbs / Protein / Vegetables）
- 可以在单元格中直接调整食材的克数，底部会自动汇总每餐总克数
- 拖拽和克数修改后会自动调用后端保存计划

---

## 未来可扩展的方向

- 支持自定义类别，而不限于固定的四种
- 为每种食材配置营养信息（热量、蛋白质等），在 Weekly Plan 中自动汇总
- 增加用户体系，多人分别保存自己的计划
