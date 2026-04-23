# @kairo/desktop

Tauri 2 桌面外壳，复用 `@kairo/web` 的构建产物。

## 构建前提

- Rust 工具链：https://www.rust-lang.org/tools/install
- Windows: Microsoft C++ Build Tools + WebView2
- macOS: Xcode Command Line Tools
- Linux: `libwebkit2gtk-4.1-dev`、`libssl-dev`、`libayatana-appindicator3-dev`

## 命令

```bash
# 开发（自动启动 web dev server）
pnpm --filter @kairo/desktop dev

# 生产构建
pnpm --filter @kairo/desktop build
```

## 自动更新

`tauri.conf.json` 中的 `plugins.updater.pubkey` 需要替换为 `tools/cli` 生成的更新签名公钥。部署步骤由 `kairo deploy desktop` 自动处理。

> 注意：Rust 侧 (`src-tauri/`) 目录尚未生成，首次构建时执行：
> ```bash
> pnpm --filter @kairo/desktop tauri init
> ```
> 然后把本目录的 `tauri.conf.json` 覆盖到 `src-tauri/` 下。
