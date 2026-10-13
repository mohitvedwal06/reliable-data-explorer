# Order Explorer

A React and TypeScript explorer for 12,000 mock orders.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. Vite serves the frontend on port 5173 and the Express mock API on port 3001.

## Features

- Search, filter, sort, and paginate orders.
- Keep the current view in the URL.
- Debounce search and cancel outdated requests.
- Virtualize table rows for smoother scrolling.
- Open order details with a shareable URL.
- Simulate API delays and occasional failures.

## API

- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/health`

List parameters: `q`, `status`, `city`, `sort`, `order`, `page`, and `pageSize`.

On Vercel, the API is served by the functions in `api/`. Locally, the Express server in `server/` is used.
