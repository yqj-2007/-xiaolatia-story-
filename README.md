# 小辣条互动任务

## 启动

```bash
node server.js
```

打开 http://localhost:4173/。

## 项目结构

- `index.html`：前端单页、插画视觉、四关互动流程。
- `server.js`：Node 原生 HTTP 后端，提供会话创建、进度保存和读取接口。
- `package.json`：启动脚本。

## 接口

- `POST /api/session` 创建任务会话。
- `POST /api/session/:id/step` 保存关卡与选择。
- `GET /api/session/:id` 读取当前进度。
