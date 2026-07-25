import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner, StatusBadge } from '../components/ui';
import { useAuth } from '../auth/context';
import { api } from '../lib/api';
import { formatCount, formatRelative, formatRent } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import { useAsync } from '../lib/useAsync';

/** One row per status so meta.total gives the count without fetching all rows. */
async function loadOverview() {
  const [pending, approved, rejected, drafts, landlords, enquiries] = await Promise.all([
    api.listings({ status: 'PENDING', page: 1, limit: 5 }),
    api.listings({ status: 'APPROVED', page: 1, limit: 1 }),
    api.listings({ status: 'REJECTED', page: 1, limit: 1 }),
    api.listings({ status: 'DRAFT', page: 1, limit: 1 }),
    api.landlords(),
    api.enquiries({ page: 1, limit: 5 }),
  ]);
  return { pending, approved, rejected, drafts, landlords, enquiries };
}

export function Dashboard() {
  const { user } = useAuth();
  const { lang } = usePrefs();
  const load = useCallback(loadOverview, [lang]);
  const { data, loading, error, reload } = useAsync(load, [lang]);

  if (loading) return <Spinner label="Loading dashboard" />;
  if (error || !data) {
    return <ErrorState message={error ?? 'No data returned.'} onRetry={reload} />;
  }

  const unverified = data.landlords.filter((l) => !l.landlordApproved).length;
  const pendingCount = data.pending.meta.total;

  const tiles = [
    {
      label: 'Awaiting review',
      value: pendingCount,
      hint: pendingCount > 0 ? 'Needs your attention' : 'All clear',
      to: '/listings?status=PENDING',
      attention: pendingCount > 0,
    },
    {
      label: 'Approved listings',
      value: data.approved.meta.total,
      hint: 'Live for tenants',
      to: '/listings?status=APPROVED',
      attention: false,
    },
    {
      label: 'Rejected',
      value: data.rejected.meta.total,
      hint: 'Declined submissions',
      to: '/listings?status=REJECTED',
      attention: false,
    },
    {
      label: 'Drafts',
      value: data.drafts.meta.total,
      hint: 'Not yet submitted',
      to: '/listings?status=DRAFT',
      attention: false,
    },
    {
      label: 'Landlords',
      value: data.landlords.length,
      hint: `${unverified} unverified`,
      to: '/landlords',
      attention: unverified > 0,
    },
    {
      label: 'Enquiries',
      value: data.enquiries.meta.total,
      hint: 'All time',
      to: '/enquiries',
      attention: false,
    },
  ];

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p>Here is what needs your attention today.</p>
        </div>
        <button type="button" className="btn btn--secondary" onClick={reload}>
          Refresh
        </button>
      </header>

      <div className="tiles">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className={`tile${tile.attention ? ' tile--attention' : ''}`}
          >
            <span className="tile__label">{tile.label}</span>
            <span className="tile__value">{formatCount(tile.value)}</span>
            <span className="tile__hint">{tile.hint}</span>
          </Link>
        ))}
      </div>

      <div className="grid-2">
        <section className="card">
          <header className="card__head">
            <h2>Awaiting review</h2>
            <Link className="link" to="/listings?status=PENDING">
              View all
            </Link>
          </header>
          {data.pending.data.length === 0 ? (
            <EmptyState
              title="Queue is empty"
              description="Every submitted listing has been reviewed."
            />
          ) : (
            <ul className="mini-list">
              {data.pending.data.map((listing) => (
                <li key={listing.id}>
                  <Link to="/listings?status=PENDING" className="mini-list__row">
                    {listing.images[0] ? (
                      <img
                        className="listing-cell__thumb"
                        src={listing.images[0].thumbnailUrl ?? listing.images[0].url}
                        alt=""
                      />
                    ) : (
                      <span className="listing-cell__thumb listing-cell__thumb--empty" />
                    )}
                    <span className="stack">
                      <strong dir={lang === 'ar' ? 'rtl' : 'ltr'}>{listing.title}</strong>
                      <span className="muted">
                        #{listing.listingNumber} · {listing.landlord.name} ·{' '}
                        {formatRent(listing.rent)}
                      </span>
                    </span>
                    <StatusBadge status={listing.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <header className="card__head">
            <h2>Latest enquiries</h2>
            <Link className="link" to="/enquiries">
              View all
            </Link>
          </header>
          {data.enquiries.data.length === 0 ? (
            <EmptyState title="No enquiries yet" />
          ) : (
            <ul className="mini-list">
              {data.enquiries.data.map((enquiry) => (
                <li key={enquiry.id}>
                  <div className="mini-list__row">
                    <span className="avatar avatar--sm" aria-hidden="true">
                      {enquiry.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="stack">
                      <strong>{enquiry.name}</strong>
                      <span className="muted mini-list__excerpt">{enquiry.message}</span>
                    </span>
                    <span className="muted nowrap">{formatRelative(enquiry.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
