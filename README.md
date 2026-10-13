# Order Explorer

A React + TypeScript data explorer for 12,000 mock orders.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The frontend runs on port 5173 and the mock API runs on port 3001.

## Features

- Search, filter, sort, and paginate orders through the API.
- Keep the current view in the URL.
- Cancel outdated requests and debounce search input.
- Virtualize table rows for smoother scrolling.
- Open an order from a shareable detail URL.
- Simulate API delays (200ms – 3s) and occasional failures.

## API

- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/health`

List query parameters: `q`, `status`, `city`, `sort`, `order`, `page`, and `pageSize`.
