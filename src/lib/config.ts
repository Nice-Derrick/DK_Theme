export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'Site Name',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/',
  enableMock: String(import.meta.env.VITE_ENABLE_MOCK ?? 'true') !== 'false',
  support: {
    telegramContactLabel: import.meta.env.VITE_SUPPORT_TELEGRAM_CONTACT_LABEL || '@your_support',
    telegramContactUrl: import.meta.env.VITE_SUPPORT_TELEGRAM_CONTACT_URL || 'https://t.me/your_support',
    telegramGroupLabel: import.meta.env.VITE_SUPPORT_TELEGRAM_GROUP_LABEL || '@your_group',
    telegramGroupUrl: import.meta.env.VITE_SUPPORT_TELEGRAM_GROUP_URL || 'https://t.me/your_group',
  },
  nodeStatus: {
    apiPath: import.meta.env.VITE_NODE_STATUS_API_PATH || '/api/v1/user/server/fetch',
    refreshIntervalMs: Number(import.meta.env.VITE_NODE_STATUS_REFRESH_INTERVAL_MS || 15000),
  },
  downloads: {
    v2rayN: {
      windows:
        import.meta.env.VITE_DOWNLOAD_V2RAYN_WINDOWS ||
        'https://github.com/2dust/v2rayN/releases/download/7.19.5/v2rayN-windows-64-desktop.zip',
      macIntel:
        import.meta.env.VITE_DOWNLOAD_V2RAYN_MAC_INTEL ||
        'https://github.com/2dust/v2rayN/releases/download/7.19.5/v2rayN-macos-64.dmg',
      macAppleSilicon:
        import.meta.env.VITE_DOWNLOAD_V2RAYN_MAC_ARM ||
        'https://github.com/2dust/v2rayN/releases/download/7.19.5/v2rayN-macos-arm64.dmg',
    },
    clash: {
      windows:
        import.meta.env.VITE_DOWNLOAD_CLASH_WINDOWS ||
        'https://github.com/MetaCubeX/mihomo/releases/download/v1.19.23/mihomo-windows-amd64-compatible-v1.19.23.zip',
      macIntel:
        import.meta.env.VITE_DOWNLOAD_CLASH_MAC_INTEL ||
        'https://github.com/MetaCubeX/mihomo/releases/download/v1.19.23/mihomo-darwin-amd64-compatible-v1.19.23.gz',
      macAppleSilicon:
        import.meta.env.VITE_DOWNLOAD_CLASH_MAC_ARM ||
        'https://github.com/MetaCubeX/mihomo/releases/download/v1.19.23/mihomo-darwin-arm64-v1.19.23.gz',
    },
  },
}
