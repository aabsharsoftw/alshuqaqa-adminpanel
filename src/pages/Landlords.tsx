import { useCallback, useMemo, useState } from 'react';
import { useToast } from '../components/toast';
import { EmptyState, ErrorState, Spinner, TrustBadge } from '../components/ui';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { errorMessage, useAsync } from '../lib/useAsync';

type Filter = 'ALL' | 'UNVERIFIED' | 'TRUSTED';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'UNVERIFIED', label: 'Unverified' },
  { value: 'TRUSTED', label: 'Trusted' },
];

export function Landlords() {
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  const load = useCallback(() => api.landlords(), []);
  const { data, loading, error, reload, setData } = useAsync(load, []);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? [])
      .filter((l) =>
        filter === 'ALL'
          ? true
          : filter === 'TRUSTED'
            ? l.landlordApproved
            : !l.landlordApproved,
      )
      .filter((l) =>
        term ? `${l.name} ${l.email} ${l.phone ?? ''}`.toLowerCase().includes(term) : true,
      );
  }, [data, filter, search]);

  async function approve(id: string, name: string) {
    setApproving(id);
    try {
      await api.approveLandlord(id);
      setData((current) =>
        current
          ? current.map((l) => (l.id === id ? { ...l, landlordApproved: true } : l))
          : current,
      );
      toast.push('success', `${name} is now a trusted landlord.`);
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
          <h1>Landlords</h1>
          <p>Trusted landlords have their future listings approved automatically.</p>
        </div>
        <input
          type="search"
          className="input input--search"
          placeholder="Search landlords…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <div className="tabs" role="tablist">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            className={`tab${filter === item.value ? ' tab--active' : ''}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="card">
        {loading && <Spinner label="Loading landlords" />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title="No landlords found"
            description="Try a different filter or search term."
          />
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Landlord</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Listings</th>
                  <th scope="col">Trust</th>
                  <th scope="col">Joined</th>
                  <th scope="col" className="table__actions-head">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((landlord) => (
                  <tr key={landlord.id}>
                    <td>
                      <span className="person">
                        <span className="avatar avatar--sm" aria-hidden="true">
                          {landlord.name.charAt(0).toUpperCase()}
                        </span>
                        <strong>{landlord.name}</strong>
                      </span>
                    </td>
                    <td>
                      <span className="stack">
                        <a href={`mailto:${landlord.email}`}>{landlord.email}</a>
                        {landlord.phone && (
                          <a className="muted" href={`tel:${landlord.phone}`}>
                            {landlord.phone}
                          </a>
                        )}
                      </span>
                    </td>
                    <td className="nowrap">{landlord._count.listings}</td>
                    <td>
                      <TrustBadge approved={landlord.landlordApproved} />
                    </td>
                    <td className="nowrap muted">{formatDate(landlord.createdAt)}</td>
                    <td>
                      {landlord.landlordApproved ? (
                        <span className="muted">—</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={approving === landlord.id}
                          onClick={() => approve(landlord.id, landlord.name)}
                        >
                          {approving === landlord.id ? 'Approving…' : 'Mark trusted'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
