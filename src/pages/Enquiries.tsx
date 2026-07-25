import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState, ErrorState, Pagination, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { formatDateTime, formatRelative } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import { useAsync } from '../lib/useAsync';

export function Enquiries() {
  const [params, setParams] = useSearchParams();
  const { lang } = usePrefs();
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const [search, setSearch] = useState('');

  const load = useCallback(() => api.enquiries({ page, limit: 20 }), [page]);
  const { data, loading, error, reload } = useAsync(load, [page]);

  const rows = useMemo(() => {
    const list = data?.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((enquiry) =>
      [
        enquiry.name,
        enquiry.phone,
        enquiry.email ?? '',
        enquiry.message,
        String(enquiry.listing.listingNumber),
        enquiry.listing.titleEn,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [data, search]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Enquiries</h1>
          <p>Tenant enquiries submitted against listings, newest first.</p>
        </div>
        <input
          type="search"
          className="input input--search"
          placeholder="Filter this page…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <section className="card">
        {loading && <Spinner label="Loading enquiries" />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title="No enquiries"
            description={
              search ? 'Nothing on this page matches your filter.' : 'Nothing has come in yet.'
            }
          />
        )}

        {!loading && !error && rows.length > 0 && (
          <ul className="enquiry-list">
            {rows.map((enquiry) => {
              const title =
                lang === 'ar' ? enquiry.listing.titleAr : enquiry.listing.titleEn;
              const location =
                lang === 'ar' ? enquiry.listing.locationAr : enquiry.listing.locationEn;
              return (
                <li key={enquiry.id} className="enquiry">
                  <div className="enquiry__head">
                    <span className="person">
                      <span className="avatar avatar--sm" aria-hidden="true">
                        {enquiry.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="stack">
                        <strong>{enquiry.name}</strong>
                        <span className="muted">
                          <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>
                          {enquiry.email && (
                            <>
                              {' · '}
                              <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
                            </>
                          )}
                        </span>
                      </span>
                    </span>
                    <time
                      className="muted nowrap"
                      dateTime={enquiry.createdAt}
                      title={formatDateTime(enquiry.createdAt)}
                    >
                      {formatRelative(enquiry.createdAt)}
                    </time>
                  </div>

                  <p className="enquiry__message" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    {enquiry.message}
                  </p>

                  <p className="enquiry__listing">
                    <span className="badge badge--neutral">
                      #{enquiry.listing.listingNumber}
                    </span>
                    <span dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                      {title} — {location}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {data && !loading && !error && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onChange={(next) => {
              const merged = new URLSearchParams(params);
              merged.set('page', String(next));
              setParams(merged, { replace: true });
            }}
          />
        )}
      </section>
    </>
  );
}
