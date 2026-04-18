# DK Theme for XBoard / V2Board

一个基于 React + Vite + TypeScript 的前端主题工程，适用于 XBoard / V2Board 风格面板，可自行修改站点名、后端地址、客服入口与下载链接后重新构建部署。

演示站：
- https://dk-theme.vercel.app/
- 账号密码随意填写
![](https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/landscape/webp/20260418-2f94ebb2.webp)
![](https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/landscape/webp/20260418-7aaf7182.webp)
![](https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/landscape/webp/20260418-7cdc6df1.webp)
![](https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/landscape/webp/20260418-7debfa7e.webp)
## 项目特点

- 支持自定义站点名
- 支持自定义后端地址
- 支持 mock 模式本地预览
- 支持自定义 Telegram 联系方式
- 支持自定义客户端下载链接
- 主题文件不含广告和任何牛皮癣内容
- 不做联网验证
- 源码透明公开，可自行审查与修改

## 快速开始

```bash
npm install
cp .env.example .env
npm run dev
```

启动后按需修改 `.env` 配置即可。

## 构建

```bash
npm install
cp .env.example .env
npm run build
```

构建产物输出到：
- `dist/`

如需导出独立静态发布目录：

```bash
npm run export:release
```

## 常用配置

主要配置文件：
- `.env`
- `.env.example`
- `src/lib/config.ts`

示例：

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

下载链接也支持通过 `.env` 里的 `VITE_DOWNLOAD_*` 变量覆盖。

## 改成你自己的站点

修改站点名：

```env
VITE_APP_NAME=你的站点名
```

改成你自己的后端：

```env
VITE_API_BASE_URL=https://your-domain.com
VITE_ENABLE_MOCK=false
```

修改 `.env` 后，请重启开发服务器或重新构建。

## 部署

### Nginx

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

## 如何确认配置已生效

1. 检查页面标题和侧边栏品牌名是否变化
2. 打开浏览器 Network，确认请求是否发往你自己的 `VITE_API_BASE_URL`
3. 如果仍显示演示数据，请确认 `VITE_ENABLE_MOCK=false`
4. 运行 `npm run build`，确认成功产出 `dist/`

## 主题定制 / 技术咨询

如需定制主题或技术咨询，请联系：

[@derrickill](https://t.me/derrickill)

## License

MIT

## 说明

本仓库仅提供前端主题工程，不包含任何生产后端凭据、账号数据或私有服务信息。
