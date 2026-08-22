import { useState } from 'react';
import { api } from '../lib/api';
import { formatDateTime, formatRent } from '../lib/format';
import type { Listing } from '../lib/types';
import { errorMessage } from '../lib/useAsync';
import { Modal } from './Modal';
import { useToast } from './toast';
import { StatusBadge } from './ui';

type Pending = 'approve' | 'reject' | 'delete' | null;

export function ListingDialog({
  listing,
  onClose,
  onUpdated,
  onDeleted,
}: {
  listing: Listing;
  onClose: () => void;
  onUpdated: (listing: Listing) => void;
  onDeleted: (id: string) => void;
}) {
  const toast = useToast();
  const [pending, setPending] = useState<Pending>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [active, setActive] = useState(0);

  const image = listing.images[active];

  async function run(action: Pending, task: () => Promise<void>) {
    setPending(action);
    try {
      await task();
    } catch (err) {
      toast.push('error', errorMessage(err));
    } finally {
      setPending(null);
    }
  }

  const approve = () =>
    run('approve', async () => {
      const updated = await api.approveListing(listing.id);
      onUpdated(updated);
      toast.push('success', `Listing #${listing.listingNumber} approved.`);
      onClose();
    });

  const reject = () =>
    run('reject', async () => {
      const updated = await api.rejectListing(listing.id, reason.trim() || undefined);
      onUpdated(updated);
      toast.push('success', `Listing #${listing.listingNumber} rejected.`);
      onClose();
    });

  const remove = () =>
    run('delete', async () => {
      await api.deleteListing(listing.id);
      onDeleted(listing.id);
      toast.push('success', `Listing #${listing.listingNumber} deleted.`);
      onClose();
    });

  const busy = pending !== null;

  return (
    <Modal
      size="lg"
      title={`Listing #${listing.listingNumber}`}
      onClose={onClose}
      footer={
        <div className="modal__actions">
          <button
            type="button"
            className="btn btn--danger-ghost"
            disabled={busy}
            onClick={() => {
              if (confirm('Delete this listing and its images permanently?')) remove();
            }}
          >
            {pending === 'delete' ? 'Deleting…' : 'Delete'}
          </button>
          <div className="modal__actions-right">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Close
            </button>
            {listing.status !== 'REJECTED' && (
              <button
                type="button"
                className="btn btn--danger"
                disabled={busy}
                onClick={() => setRejecting(true)}
              >
                Reject
              </button>
            )}
            {listing.status !== 'APPROVED' && (
              <button
                type="button"
                className="btn btn--primary"
                disabled={busy}
                onClick={approve}
              >
                {pending === 'approve' ? 'Approving…' : 'Approve'}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="listing-detail">
        <div className="listing-detail__media">
          {image ? (
            <>
              <img src={image.url} alt={listing.title} className="listing-detail__hero" />
              {listing.images.length > 1 && (
                <div className="thumbs">
                  {listing.images.map((img, index) => (
                    <button
                      key={img.id}
                      type="button"
                      className={`thumb${index === active ? ' thumb--active' : ''}`}
                      onClick={() => setActive(index)}
                      aria-label={`Image ${index + 1}`}
                    >
                      <img src={img.thumbnailUrl ?? img.url} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="listing-detail__hero listing-detail__hero--empty">
              No images
            </div>
          )}
        </div>

        <div className="listing-detail__info">
          <div className="listing-detail__row">
            <StatusBadge status={listing.status} />
            <span className="listing-detail__rent">{formatRent(listing.rent)}</span>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Title (EN)</dt>
              <dd>{listing.titleEn}</dd>
            </div>
            <div>
              <dt>Title (AR)</dt>
              <dd dir="rtl" lang="ar">
                {listing.titleAr}
              </dd>
            </div>
            <div>
              <dt>Location (EN)</dt>
              <dd>{listing.locationEn}</dd>
            </div>
            <div>
              <dt>Location (AR)</dt>
              <dd dir="rtl" lang="ar">
                {listing.locationAr}
              </dd>
            </div>
            <div>
              <dt>Description (EN)</dt>
              <dd className="detail-list__long">{listing.descriptionEn}</dd>
            </div>
            <div>
              <dt>Description (AR)</dt>
              <dd className="detail-list__long" dir="rtl" lang="ar">
                {listing.descriptionAr}
              </dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{listing.category ? listing.category.name : <span className="muted">—</span>}</dd>
            </div>
            <div>
              <dt>Landlord</dt>
              <dd>
                {listing.landlord.name}
                <br />
                <a href={`mailto:${listing.landlord.email}`}>{listing.landlord.email}</a>
                {listing.landlord.phone && (
                  <>
                    <br />
                    <a href={`tel:${listing.landlord.phone}`}>{listing.landlord.phone}</a>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{formatDateTime(listing.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {rejecting && (
        <Modal
          title={`Reject listing #${listing.listingNumber}`}
          onClose={() => setRejecting(false)}
          footer={
            <div className="modal__actions">
              <div className="modal__actions-right">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setRejecting(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  disabled={busy}
                  onClick={reject}
                >
                  {pending === 'reject' ? 'Rejecting…' : 'Confirm rejection'}
                </button>
              </div>
            </div>
          }
        >
          <label className="field">
            <span>Reason (optional — included in the email to the landlord)</span>
            <textarea
              rows={4}
              maxLength={500}
              value={reason}
              placeholder="e.g. Images are unclear, please re-upload."
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <p className="field__hint">{reason.length}/500</p>
        </Modal>
      )}
    </Modal>
  );
}
