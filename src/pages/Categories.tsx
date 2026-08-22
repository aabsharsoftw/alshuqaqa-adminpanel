import { useCallback, useState } from 'react';
import { useToast } from '../components/toast';
import { EmptyState, ErrorState, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import { errorMessage, useAsync } from '../lib/useAsync';

export function Categories() {
  const toast = useToast();
  const { lang } = usePrefs();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => api.categories(), []);
  // `lang` is not read here — it travels as Accept-Language — but changing it
  // must refetch the localized names, so it stays in the effect deps.
  const { data, loading, error, reload, setData } = useAsync(load, [lang]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const created = await api.createCategory(trimmed);
      setData((current) => (current ? [...current, created] : [created]));
      setName('');
      toast.push('success', `Category “${created.name}” added.`);
    } catch (err) {
      toast.push('error', errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string, label: string) {
    if (
      !confirm(
        `Delete the category “${label}”? Listings using it will be kept but left uncategorized.`,
      )
    ) {
      return;
    }
    setDeleting(id);
    try {
      await api.deleteCategory(id);
      setData((current) => (current ? current.filter((c) => c.id !== id) : current));
      toast.push('success', `Category “${label}” deleted.`);
    } catch (err) {
      toast.push('error', errorMessage(err));
    } finally {
      setDeleting(null);
    }
  }

  const rows = data ?? [];

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Categories</h1>
          <p>
            Categories tenants use to filter listings. The name is auto-translated to the
            other language.
          </p>
        </div>
      </header>

      <section className="card">
        <form className="row-actions" onSubmit={create}>
          <input
            className="input"
            placeholder={lang === 'ar' ? 'اسم التصنيف الجديد…' : 'New category name…'}
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={creating || !name.trim()}
          >
            {creating ? 'Adding…' : 'Add category'}
          </button>
        </form>
      </section>

      <section className="card">
        {loading && <Spinner label="Loading categories" />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && rows.length === 0 && (
          <EmptyState
            title="No categories yet"
            description="Add your first category using the form above."
          />
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name (EN)</th>
                  <th scope="col">Name (AR)</th>
                  <th scope="col">Created</th>
                  <th scope="col" className="table__actions-head">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <strong>{category.nameEn}</strong>
                    </td>
                    <td dir="rtl" lang="ar">
                      {category.nameAr}
                    </td>
                    <td className="nowrap muted">{formatDate(category.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--danger-ghost btn--sm"
                        disabled={deleting === category.id}
                        onClick={() => remove(category.id, category.nameEn)}
                      >
                        {deleting === category.id ? 'Deleting…' : 'Delete'}
                      </button>
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
