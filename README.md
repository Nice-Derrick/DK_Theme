# DK Theme for XBoard / V2Board

A customizable front-end theme for XBoard / V2Board-style panels, built with React, Vite, and TypeScript.

Demo: https://dk-theme.vercel.app/

## Features

- Custom site name
- Custom API base URL
- Mock mode for local preview
- Custom Telegram contact links
- Custom client download links
- Ready for self-hosting

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local dev server, then edit `.env` as needed.

## Build

```bash
npm install
cp .env.example .env
npm run build
```

Build output:
- `dist/`

Optional release export:

```bash
npm run export:release
```

## Configuration

Main config files:
- `.env`
- `.env.example`
- `src/lib/config.ts`

Example:

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

Download links can also be overridden with `VITE_DOWNLOAD_*` variables in `.env`.

## Use Your Own Site Name

```env
VITE_APP_NAME=Your Site Name
```

## Use Your Own Backend

```env
VITE_API_BASE_URL=https://your-domain.com
VITE_ENABLE_MOCK=false
```

After changing `.env`, restart dev server or rebuild the project.

## Deploy

### Vercel

This project can be deployed directly to Vercel.

Recommended settings:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Set your own `VITE_*` environment variables before deploying.

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

## Verify Your Config

1. Check the page title and brand name
2. Check browser Network requests go to your `VITE_API_BASE_URL`
3. If you still see demo data, make sure `VITE_ENABLE_MOCK=false`
4. Run `npm run build` and confirm `dist/` is generated

## License

MIT

## Disclaimer

This repository only provides the front-end theme project. It does not include production backend credentials, accounts, or private service data.
