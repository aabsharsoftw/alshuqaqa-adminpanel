import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/toast';
import { EmptyState, ErrorState, Pagination, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { formatDateTime, formatRelative } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import { errorMessage, useAsync } from '../lib/useAsync';

export function Enquiries() {
  const [params, setParams] = useSearchParams();
  const { lang } = usePrefs();
  const toast = useToast();
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => api.enquiries({ page, limit: 20 }), [page]);
  const { data, loading, error, reload, setData } = useAsync(load, [page]);

  async function toggleContacted(id: string, contacted: boolean) {
    setUpdating(id);
    try {
      const updated = await api.setEnquiryContacted(id, contacted);
      setData((current) =>
        current
          ? {
              ...current,
              data: current.data.map((e) =>
                e.id === id
                  ? { ...e, contacted: updated.contacted, contactedAt: updated.contactedAt }
                  : e,
              ),
            }
          : current,
      );
      toast.push(
        'success',
        contacted ? 'Marked as contacted.' : 'Marked as not contacted.',
      );
    } catch (err) {
      toast.push('error', errorMessage(err));
    } finally {
      setUpdating(null);
    }
  }

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
                    <span className="enquiry__meta">
                      <span
                        className={`badge badge--${enquiry.contacted ? 'approved' : 'pending'}`}
                        title={
                          enquiry.contacted && enquiry.contactedAt
                            ? `Contacted ${formatDateTime(enquiry.contactedAt)}`
                            : undefined
                        }
                      >
                        {enquiry.contacted ? 'Contacted' : 'Not contacted'}
                      </span>
                      <time
                        className="muted nowrap"
                        dateTime={enquiry.createdAt}
                        title={formatDateTime(enquiry.createdAt)}
                      >
                        {formatRelative(enquiry.createdAt)}
                      </time>
                    </span>
                  </div>

                  <p className="enquiry__message" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    {enquiry.message}
                  </p>

                  <div className="enquiry__footer">
                    <p className="enquiry__listing">
                      <span className="badge badge--neutral">
                        #{enquiry.listing.listingNumber}
                      </span>
                      <span dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        {title} — {location}
                      </span>
                    </p>
                    <button
                      type="button"
                      className={`btn btn--sm ${enquiry.contacted ? 'btn--secondary' : 'btn--primary'}`}
                      disabled={updating === enquiry.id}
                      onClick={() => toggleContacted(enquiry.id, !enquiry.contacted)}
                    >
                      {updating === enquiry.id
                        ? 'Saving…'
                        : enquiry.contacted
                          ? 'Mark not contacted'
                          : 'Mark contacted'}
                    </button>
                  </div>
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
