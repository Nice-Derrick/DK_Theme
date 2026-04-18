# DK Theme for XBoard / V2Board

一个基于 React + Vite + TypeScript 的可配置前端主题工程，面向 XBoard / V2Board 风格用户中心场景。

定位：
- 可开源
- 可自行修改站点名、后端地址、客服入口、客户端下载链接
- 支持 mock 预览与接入真实兼容后端
- 适合作为二开源码仓库，而不是仅用于展示的静态构建产物

说明：
- 当前仓库默认示例配置使用 mock 数据
- 不包含任何真实生产后端地址、密钥或账号信息
- 若你要接入自己的后端，请修改 `.env`

## 技术栈

- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios

## 已包含页面

- 登录
- 注册
- 重置密码
- 仪表盘
- 订阅中心 / 客户端下载
- 套餐页
- 邀请返利
- 工单
- 帮助文档
- 安全中心
- 节点状态

## 本地开发

```bash
npm install
cp .env.example .env
npm run dev
```

默认开发模式下：
- `VITE_ENABLE_MOCK=true`
- 前端将使用内置 mock 数据进行预览

## 生产构建

```bash
npm install
cp .env.example .env
npm run build
```

构建产物输出到：
- `dist/`

如果你需要导出一个独立静态发布目录：

```bash
npm run export:release
```

导出目录为：
- `/root/workspace/DK_Theme_release`

## 配置说明

主要配置文件：
- `.env`
- `.env.example`
- `src/lib/config.ts`

常用配置项：

```env
VITE_APP_NAME=Site Name
VITE_API_BASE_URL=/
VITE_ENABLE_MOCK=true

VITE_SUPPORT_TELEGRAM_CONTACT_LABEL=@your_support
VITE_SUPPORT_TELEGRAM_CONTACT_URL=https://t.me/your_support
VITE_SUPPORT_TELEGRAM_GROUP_LABEL=@your_group
VITE_SUPPORT_TELEGRAM_GROUP_URL=https://t.me/your_group

VITE_NODE_STATUS_API_PATH=/api/v1/user/server/fetch
VITE_NODE_STATUS_REFRESH_INTERVAL_MS=15000
```

客户端下载链接也支持通过环境变量覆盖：
- `VITE_DOWNLOAD_V2RAYN_WINDOWS`
- `VITE_DOWNLOAD_V2RAYN_MAC_INTEL`
- `VITE_DOWNLOAD_V2RAYN_MAC_ARM`
- `VITE_DOWNLOAD_CLASH_WINDOWS`
- `VITE_DOWNLOAD_CLASH_MAC_INTEL`
- `VITE_DOWNLOAD_CLASH_MAC_ARM`

## 如何改成你自己的站点

### 1) 修改站点名

修改：

```env
VITE_APP_NAME=你的站点名
```

效果：
- 页面标题
- 侧边栏品牌名
- 订阅导入时显示的名称

### 2) 改成你自己的后端地址

修改：

```env
VITE_API_BASE_URL=https://your-domain.com
VITE_ENABLE_MOCK=false
```

说明：
- `VITE_API_BASE_URL` 为你的后端根地址
- `VITE_ENABLE_MOCK=false` 后，前端会请求真实接口

### 3) 修改客服入口

修改：

```env
VITE_SUPPORT_TELEGRAM_CONTACT_LABEL=@your_support
VITE_SUPPORT_TELEGRAM_CONTACT_URL=https://t.me/your_support
VITE_SUPPORT_TELEGRAM_GROUP_LABEL=@your_group
VITE_SUPPORT_TELEGRAM_GROUP_URL=https://t.me/your_group
```

### 4) 修改客户端下载地址

直接在 `.env` 中覆盖对应 `VITE_DOWNLOAD_*` 配置即可。

## 接入真实后端

如果要接入真实 XBoard / V2Board 风格后端，推荐按下面步骤：

1. 复制配置文件
```bash
cp .env.example .env
```

2. 修改为真实环境
```env
VITE_APP_NAME=你的站点名
VITE_API_BASE_URL=https://你的后端域名
VITE_ENABLE_MOCK=false
```

3. 启动本地开发
```bash
npm run dev
```

4. 检查接口是否匹配当前实现
- `src/lib/api/services/*`
- `src/lib/api/types.ts`

如果你的后端返回结构和当前实现不完全一致，需要按实际接口调整对应 service。

## 如何验证配置是否生效

### 验证站点名
启动后检查：
- 浏览器标题是否变化
- 左侧品牌名是否变化

### 验证是否已切换到真实后端
打开浏览器开发者工具 Network，确认请求是否发往：
- 你自己的 `VITE_API_BASE_URL`

### 验证是否仍在 mock
如果仍看到演示账号、演示订阅、演示订单，通常说明：
- `VITE_ENABLE_MOCK` 仍为 `true`
- 或修改 `.env` 后未重新启动/重新构建

### 验证生产构建
```bash
npm run build
```
预期结果：
- 构建成功
- 产出 `dist/`

## 部署

### Vercel
本项目已包含 `vercel.json`，可直接部署。

推荐设置：
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

部署前请在环境变量中填写你自己的 `VITE_*` 配置。

### Nginx
如果你部署的是构建后的 `dist/`，可使用类似配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/dk-theme/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 开源使用建议

如果你希望别人能够：
- fork 后自行改站点名
- 修改后端地址
- 自定义下载链接
- 重新构建和部署

请直接使用本源码仓库，而不是只使用静态的 `dist/` 或 `DK_Theme_release/`。

## 许可

本项目采用 MIT License。

## 免责声明

- 本项目是一个可配置前端主题工程/界面实现
- 仓库不提供任何生产服务账号或后端凭据
- 使用者应自行确保其部署、接口接入与业务用途符合法律法规及目标后端的许可要求
