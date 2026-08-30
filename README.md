# lifebalance

A simple, thoughtful app that helps you turn the changes you want in your life into meaningful actions. Set goals, choose what will help you achieve them, plan your actions, stay focused on what matters today, and reflect regularly to build a system that truly works for you.

## Development

Install Node.js and npm, then run:

```sh
npm install
npm run dev:cloud
```

You can also double-click `Preview My Daily Flow.command` on macOS to launch the app locally.

The application stores each browser's private workspace in Cloudflare D1. Local development uses
Wrangler's local D1 database; production migrations are applied by `npm run deploy` before the
Worker is published.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Cloudflare Workers and D1
