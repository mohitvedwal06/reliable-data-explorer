import { useEffect, useMemo, useRef, useState } from "react";
import { Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { fetchOrder, fetchOrders, type ListParams } from "./api";
import type { Order } from "./types";
import { DEFAULTS, cities, formatDate, money, paramsToString, parseParams } from "./lib/orderUtils";

function Explorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useMemo(() => parseParams(searchParams), [searchParams]);
  const [draft, setDraft] = useState(params.q);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollKey = "orders-explorer-scroll";

  useEffect(() => { setDraft(params.q); }, [params.q]);
  useEffect(() => {
    const saved = sessionStorage.getItem(scrollKey);
    if (saved && listRef.current) {
      listRef.current.scrollTop = Number(saved);
      sessionStorage.removeItem(scrollKey);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft !== params.q) {
        setSearchParams(paramsToString({ ...params, q: draft, page: 1 }), { replace: true });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft]); // debounce user typing; URL changes only after quiet period

  const query = useQuery({
    queryKey: ["orders", params],
    queryFn: ({ signal }) => fetchOrders(params, signal),
    placeholderData: undefined
  });

  function update(next: Partial<ListParams>) {
    setSearchParams(paramsToString({ ...params, ...next }), { replace: false });
  }
  function openDetail(order: Order) {
    sessionStorage.setItem(scrollKey, String(listRef.current?.scrollTop ?? 0));
    navigate({ pathname: `/orders/${order.id}`, search: searchParams.toString() });
  }
  const rows = query.data?.data ?? [];
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 54,
    overscan: 8
  });

  const error = query.error instanceof Error ? query.error.message : "Could not load orders.";
  const sortLabel = (key: string) => params.sort === key ? (params.order === "asc" ? " ↑" : " ↓") : "";

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark">O</div>
        <div><div className="eyebrow">OPERATIONS / DATA</div><h1>Order Explorer</h1></div>
        <div className="topbar-right"><span className="live-dot" /> Mock API · 12,000 records</div>
      </header>
      <section className="intro">
        <div><h2>Orders</h2><p>Search and inspect order activity across your dataset.</p></div>
        <div className="metric"><span className="metric-label">RESULTS</span><strong>{query.isSuccess ? query.data.total.toLocaleString("en-IN") : "—"}</strong></div>
      </section>
      <section className="toolbar" aria-label="Order filters">
        <label className="search-box"><span aria-hidden="true">⌕</span><span className="sr-only">Search orders</span>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search ID, customer, email…" />
          {draft && <button className="clear-search" onClick={() => setDraft("")} aria-label="Clear search">×</button>}
        </label>
        <label className="filter-label">Status
          <select value={params.status} onChange={(e) => update({ status: e.target.value, page: 1 })}>
            <option value="">All statuses</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="refunded">Refunded</option><option value="failed">Failed</option>
          </select>
        </label>
        <label className="filter-label">City
          <select value={params.city} onChange={(e) => update({ city: e.target.value, page: 1 })}>
            <option value="">All cities</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </label>
        <button className="secondary-button" onClick={() => { setDraft(""); setSearchParams(new URLSearchParams()); }} disabled={!params.q && !params.status && !params.city}>Reset</button>
      </section>
      <section className="table-card" aria-label="Order results">
        <div className="table-heading">
          <div><h3>All orders</h3><p>{query.isSuccess ? `Showing ${rows.length ? ((params.page - 1) * params.pageSize + 1).toLocaleString() : 0}–${Math.min(params.page * params.pageSize, query.data.total).toLocaleString()} of ${query.data.total.toLocaleString()} results` : "Results update as you search"}</p></div>
          {query.isFetching && <span className="loading-chip"><span className="spinner" /> Updating results…</span>}
        </div>
        {query.isError ? (
          <div className="state-panel error-state" role="alert">
            <div className="state-icon">!</div><h3>We couldn't load these results</h3><p>{error}</p>
            <button className="primary-button" onClick={() => query.refetch()}>Retry request</button>
          </div>
        ) : query.isPending ? (
          <div className="state-panel" role="status"><span className="spinner large" /><h3>Loading orders</h3><p>Fetching the current view from the API…</p></div>
        ) : query.data.total === 0 ? (
          <div className="state-panel"><div className="state-icon neutral">⌕</div><h3>No matching orders</h3><p>Try another search term or remove a filter.</p><button className="secondary-button" onClick={() => { setDraft(""); setSearchParams(new URLSearchParams()); }}>Clear filters</button></div>
        ) : (
          <>
            <div className="table-scroll" ref={listRef} role="region" aria-label="Scrollable order table" tabIndex={0}>
              <div className="orders-table" role="table" aria-label="Orders">
                <div className="orders-header" role="row">
                  {[
                    ["id", "Order ID"], ["customer", "Customer"], ["status", "Status"], ["total", "Total"], ["createdAt", "Date"], ["city", "City"]
                  ].map(([key, label]) => <div key={key} role="columnheader" aria-sort={params.sort === key ? (params.order === "asc" ? "ascending" : "descending") : "none"}>
                    <button className="sort-button" onClick={() => update({ sort: key, order: params.sort === key && params.order === "asc" ? "desc" : "asc", page: 1 })}>{label}<span>{sortLabel(key)}</span></button>
                  </div>)}
                  <div role="columnheader"><span className="sr-only">Open order</span></div>
                </div>
                <div className="orders-body" role="rowgroup" style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const order = rows[virtualRow.index];
                    return <div key={order.id} role="row" className="data-row" style={{ position: "absolute", top: 0, transform: `translateY(${virtualRow.start}px)`, height: `${virtualRow.size}px`, width: "100%" }}>
                      <div role="cell"><button className="order-link" onClick={() => openDetail(order)}>{order.id}</button></div>
                      <div role="cell"><div className="customer-cell"><span className="avatar">{order.customer.split(" ").map(x => x[0]).join("").slice(0, 2)}</span><span><strong>{order.customer}</strong><small>{order.email}</small></span></div></div>
                      <div role="cell"><span className={`status status-${order.status}`}><i />{order.status}</span></div>
                      <div role="cell" className="amount">{money(order.total)}</div><div role="cell">{formatDate(order.createdAt)}</div><div role="cell">{order.city}</div>
                      <div role="cell"><button className="row-arrow" onClick={() => openDetail(order)} aria-label={`View order ${order.id}`}>↗</button></div>
                    </div>;
                  })}
                </div>
              </div>
            </div>
            <footer className="pagination">
              <label className="page-size">Rows per page <select value={params.pageSize} onChange={(e) => update({ pageSize: Number(e.target.value), page: 1 })}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label>
              <div className="page-controls"><span>Page {query.data.page} of {query.data.pages}</span><button onClick={() => update({ page: Math.max(1, params.page - 1) })} disabled={params.page <= 1} aria-label="Previous page">←</button><button onClick={() => update({ page: Math.min(query.data.pages, params.page + 1) })} disabled={params.page >= query.data.pages} aria-label="Next page">→</button></div>
            </footer>
          </>
        )}
        <div className="sr-only" role="status" aria-live="polite">{query.isSuccess ? `${query.data.total} results found` : query.isError ? `Error loading results: ${error}` : "Loading results"}</div>
      </section>
      <footer className="app-footer"><span>Order Explorer · Demo environment</span><span>Search is server-side · Table is virtualized</span></footer>
    </main>
  );
}

function OrderDetail() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const id = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const query = useQuery({ queryKey: ["order", id], queryFn: ({ signal }) => fetchOrder(id, signal), enabled: Boolean(id) });
  const back = () => navigate({ pathname: "/orders", search });
  if (query.isPending) return <main className="shell"><button className="back-link" onClick={back}>← Back to orders</button><div className="state-panel"><span className="spinner large" /><h3>Loading order details</h3></div></main>;
  if (query.isError) return <main className="shell"><button className="back-link" onClick={back}>← Back to orders</button><div className="state-panel error-state" role="alert"><h3>Unable to load order</h3><p>{query.error.message}</p><button className="primary-button" onClick={() => query.refetch()}>Retry request</button></div></main>;
  const order = query.data;
  return <main className="shell detail-shell">
    <button className="back-link" onClick={back}>← Back to orders</button>
    <header className="detail-header"><div><div className="eyebrow">ORDER DETAILS</div><h1>{order.id}</h1><p>Placed on {formatDate(order.createdAt)}</p></div><span className={`status status-${order.status}`}><i />{order.status}</span></header>
    <div className="detail-grid">
      <section className="detail-card"><h2>Customer information</h2><dl><dt>Customer</dt><dd>{order.customer}</dd><dt>Email</dt><dd>{order.email}</dd><dt>City</dt><dd>{order.city}</dd></dl></section>
      <section className="detail-card"><h2>Payment summary</h2><dl><dt>Order total</dt><dd className="detail-total">{money(order.total)}</dd><dt>Payment method</dt><dd>{order.paymentMethod}</dd><dt>Items</dt><dd>{order.items}</dd></dl></section>
      <section className="detail-card wide"><h2>Order notes</h2><p>{order.notes}</p></section>
    </div>
  </main>;
}

export default function App() {
  return <Routes><Route path="/orders/:id" element={<OrderDetail />} /><Route path="*" element={<Explorer />} /></Routes>;
}