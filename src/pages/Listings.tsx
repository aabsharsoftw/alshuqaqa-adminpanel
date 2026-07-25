import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListingDialog } from '../components/ListingDialog';
import { useToast } from '../components/toast';
import {
  EmptyState,
  ErrorState,
  Pagination,
  Spinner,
  StatusBadge,
} from '../components/ui';
import { api } from '../lib/api';
import { formatDate, formatRent } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import type { Listing, ListingStatus } from '../lib/types';
import { errorMessage, useAsync } from '../lib/useAsync';

const TABS: { value: ListingStatus | 'ALL'; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'ALL', label: 'All' },
];

function isStatus(value: string | null): value is ListingStatus {
  return value === 'DRAFT' || value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED';
}

export function Listings() {
  const [params, setParams] = useSearchParams();
  const { lang } = usePrefs();
  const toast = useToast();

  const statusParam = params.get('status');
  const status = isStatus(statusParam) ? statusParam : statusParam === 'ALL' ? 'ALL' : 'PENDING';
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Listing | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(
    () => api.listings({ status: status === 'ALL' ? undefined : status, page, limit: 20 }),
    [status, page],
  );
  // `lang` is not read here — it travels as Accept-Language — but changing it
  // must refetch, so it stays in the effect deps.
  const { data, loading, error, reload, setData } = useAsync(load, [status, page, lang]);

  const setParam = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) merged.set(key, value);
    setParams(merged, { replace: true });
  };

  const rows = useMemo(() => {
    const list = data?.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((listing) =>
      [
        listing.title,
        listing.location,
        listing.landlord.name,
        listing.landlord.email,
        String(listing.listingNumber),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [data, search]);

  const applyUpdate = (updated: Listing) => {
    setData((current) => {
      if (!current) return current;
      // A status change can move the listing out of the active filter.
      const stillMatches = status === 'ALL' || updated.status === status;
      return {
        ...current,
        data: stillMatches
          ? current.data.map((l) => (l.id === updated.id ? updated : l))
          : current.data.filter((l) => l.id !== updated.id),
      };
    });
  };

  const applyDelete = (id: string) => {
    setData((current) =>
      current ? { ...current, data: current.data.filter((l) => l.id !== id) } : current,
    );
  };

  async function quickApprove(listing: Listing) {
    setApproving(listing.id);
    try {
      applyUpdate(await api.approveListing(listing.id));
      toast.push('success', `Listing #${listing.listingNumber} approved.`);
    } catch (err) {
      toast.push('error', errorMessage(err));
    } finally {
      setApproving(null);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Listings</h1>
          <p>Review submissions and manage what tenants can see.</p>
        </div>
        <input
          type="search"
          className="input input--search"
          placeholder="Filter this page…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            className={`tab${status === tab.value ? ' tab--active' : ''}`}
            onClick={() => setParam({ status: tab.value, page: '1' })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="card">
        {loading && <Spinner label="Loading listings" />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title="Nothing here"
            description={
              search
                ? 'No listing on this page matches your filter.'
                : 'There are no listings with this status.'
            }
          />
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Listing</th>
                  <th scope="col">Rent</th>
                  <th scope="col">Landlord</th>
                  <th scope="col">Status</th>
                  <th scope="col">Submitted</th>
                  <th scope="col" className="table__actions-head">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((listing) => (
                  <tr key={listing.id}>
                    <td>
                      <button
                        type="button"
                        className="listing-cell"
                        onClick={() => setSelected(listing)}
                      >
                        {listing.images[0] ? (
                          <img
                            className="listing-cell__thumb"
                            src={listing.images[0].thumbnailUrl ?? listing.images[0].url}
                            alt=""
                          />
                        ) : (
                          <span className="listing-cell__thumb listing-cell__thumb--empty" />
                        )}
                        <span className="listing-cell__text">
                          <strong dir={lang === 'ar' ? 'rtl' : 'ltr'}>{listing.title}</strong>
                          <span dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                            #{listing.listingNumber} · {listing.location}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="nowrap">{formatRent(listing.rent)}</td>
                    <td>
                      <span className="stack">
                        <strong>{listing.landlord.name}</strong>
                        <span className="muted">{listing.landlord.email}</span>
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={listing.status} />
                    </td>
                    <td className="nowrap muted">{formatDate(listing.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => setSelected(listing)}
                        >
                          Review
                        </button>
                        {listing.status !== 'APPROVED' && (
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            disabled={approving === listing.id}
                            onClick={() => quickApprove(listing)}
                          >
                            {approving === listing.id ? '…' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && !loading && !error && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onChange={(next) => setParam({ page: String(next) })}
          />
        )}
      </section>

      {selected && (
        <ListingDialog
          listing={selected}
          onClose={() => setSelected(null)}
          onUpdated={applyUpdate}
          onDeleted={applyDelete}
        />
      )}
    </>
  );
}
