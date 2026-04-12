# Site Name Theme

这是当前较新的 React + Vite + TypeScript 版本主题工程，也是现在应继续维护与部署的版本。

目标：
- 以独立前端工程方式实现用户中心主题
- 不直接复用原主题源码
- 支持 mock 数据预览与后续接入真实 V2Board / XBoard 兼容接口
- 作为可持续迭代、可部署到 Vercel 的主题项目

## 技术栈
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui 风格组件

## 已包含页面
- 登录 / 注册 / 找回密码
- 仪表盘
- 订阅中心 / 客户端下载
- 套餐页
- 邀请返利
- 工单
- 帮助文档
- 安全中心
- 节点状态（如项目中已接入）

## 启动
```bash
npm install
cp .env.example .env
npm run dev
```

## 构建
```bash
npm run build
```

## 配置项

当前主要配置集中在：
- `.env` / `.env.example`
- `src/lib/config.ts`

常用配置：
- `VITE_APP_NAME`：站点名称
- `VITE_API_BASE_URL`：后端 API 根地址
- `VITE_ENABLE_MOCK`：是否启用前端 mock 数据
- `VITE_SUPPORT_TELEGRAM_CONTACT_LABEL`：客服账号文案
- `VITE_SUPPORT_TELEGRAM_CONTACT_URL`：客服链接
- `VITE_SUPPORT_TELEGRAM_GROUP_LABEL`：群组文案
- `VITE_SUPPORT_TELEGRAM_GROUP_URL`：群组链接
- `VITE_NODE_STATUS_API_PATH`：节点状态接口路径
- `VITE_NODE_STATUS_REFRESH_INTERVAL_MS`：节点状态自动刷新间隔
- `VITE_DOWNLOAD_*`：客户端下载地址

如果要切换到真实后端：
1. 修改 `.env`
2. 设置 `VITE_API_BASE_URL=https://你的域名/`
3. 设置 `VITE_ENABLE_MOCK=false`
4. 确认后端接口与 `src/lib/api/services/*` 中的请求路径一致
5. 如返回结构与当前实现不同，再按实际接口格式调整对应 service

当前 `apiClient` 已统一读取 `VITE_API_BASE_URL` 作为 axios `baseURL`。
站点标题、页面品牌名、客户端下载导入名称也都已跟随 `VITE_APP_NAME`。

## 部署到 Vercel
这个项目可以直接部署到 Vercel：
- Framework Preset: Vite
- Root Directory: 项目根目录
- Build Command: `npm run build`
- Output Directory: `dist`

本项目已补充：
- `vercel.json`：用于固定 Vercel 构建配置，并为 React Router 的前端路由提供回退到 `index.html` 的 rewrite
- `.env.example`：用于在本地或 Vercel 中快速补齐演示环境变量

推荐部署方式：
1. 将项目推到 GitHub
2. 在 Vercel 导入该仓库
3. 在 Vercel Project Settings → Environment Variables 中按需填写 `VITE_*` 变量
4. 如果你当前只是部署演示站，建议：
   - `VITE_ENABLE_MOCK=true`
   - `VITE_API_BASE_URL=/`
5. 如果你要接真实后端，建议：
   - `VITE_ENABLE_MOCK=false`
   - `VITE_API_BASE_URL=https://你的后端域名`
   - 并确认该后端已正确放开当前 Vercel 域名的 CORS

## 说明
当前项目为较新的 React + Vite 版本，适合继续维护、部署和开源整理。
