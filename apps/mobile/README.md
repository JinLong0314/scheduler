# @kairo/mobile

基于 Expo Router 的跨端应用（Android / iOS），并集成原生 Android 桌面小组件。

## 快速开始

```bash
pnpm --filter @kairo/mobile start
```

## Android 小组件

Expo 默认不包含原生 AppWidgetProvider。需要通过 prebuild 后在 `android/app/src/main/` 下添加 Kotlin 代码：

```
android/app/src/main/
├── java/app/kairo/mobile/widget/
│   ├── KairoWidgetProvider.kt      # AppWidgetProvider 子类
│   └── WidgetUpdateService.kt      # 从 SecureStore 读 Token → 调用 API
└── res/
    ├── layout/widget_kairo.xml     # 今日日程 + 任务列表
    └── xml/widget_kairo_info.xml   # appwidget-provider 描述
```

关键实现：
1. Widget 点击任务：通过 `PendingIntent` 启动透明 `Activity` (`FloatingEditActivity`)，`android:theme="@android:style/Theme.Translucent.NoTitleBar"`
2. 数据刷新：`WorkManager` 每 15 分钟调度一次 + `ACTION_BOOT_COMPLETED` 开机刷新
3. Token 读取：使用 `expo-secure-store` 写入的 `SharedPreferences` 键 `kairo.token`

完整原生模板见 `docs/android-widget.md`（待补充）。首次执行 `pnpm --filter @kairo/mobile android` 时会自动 prebuild 并生成原生目录。

## EAS 构建 APK

```bash
pnpm --filter @kairo/mobile build:android
```

凭证由 `tools/cli` 统一管理，不提交到仓库。
