# Kairo

> 跨平台 · Serverless · 多用户的日程与任务管理系统

继承原 M0MoNa's scheduler 的"任务分离、逐个击破"思路，重构为 Web / Desktop (Tauri) / Android (Expo + 原生 Widget) 全平台覆盖，后端全跑在 Cloudflare Workers + D1 + R2。

## 文档

- [项目介绍](./docs/项目介绍.md)
- [重构目标](./docs/重构目标.md)
- [代码规范](./docs/代码规范.md)
- [安全策略](./SECURITY.md)

## 快速开始

前置要求：Node.js ≥ 20、pnpm ≥ 9

```bash
pnpm install
pnpm dev        # 同时启动 worker + web
```

## Monorepo 结构

```
apps/
  worker/    # Cloudflare Worker API (Hono + D1 + Drizzle)
  web/       # Web / PWA (Vite + React)
  desktop/   # 桌面端 (Tauri)
  mobile/    # 移动端 (Expo + 原生 Android Widget)
packages/
  shared/    # 跨端类型与 Zod schema
  themes/    # 主题 token（4 套预置主题）
  ui/        # 跨端共享组件
tools/
  cli/       # 部署 / 更新 CLI (npx kairo ...)
```

## 部署

```bash
npx kairo init     # 首次部署到 Cloudflare（引导式）
npx kairo deploy   # 增量更新
```
