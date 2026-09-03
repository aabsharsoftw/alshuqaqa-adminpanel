import { Fragment, useCallback, useState } from 'react';
import { useToast } from '../components/toast';
import { EmptyState, ErrorState, Spinner } from '../components/ui';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { usePrefs } from '../lib/prefs';
import type { State } from '../lib/types';
import { errorMessage, useAsync } from '../lib/useAsync';

export function Places() {
  const toast = useToast();
  const { lang } = usePrefs();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const [stateName, setStateName] = useState('');
  const [creatingState, setCreatingState] = useState(false);
  const [deletingState, setDeletingState] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const loadStates = useCallback(() => api.states(), []);
  // `lang` is not read here — it rides Accept-Language — but changing it must
  // refetch the localized names, so it stays in the deps.
  const states = useAsync(loadStates, [lang]);

  async function createState(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = stateName.trim();
    if (!trimmed) return;
    setCreatingState(true);
    try {
      const created = await api.createState(trimmed);
      states.setData((current) => (current ? [...current, created] : [created]));
      setStateName('');
      toast.push('success', `State “${created.name}” added.`);
    } catch (err) {
      toast.push('error', errorMessage(err));
    } finally {
      setCreatingState(false);
    }
  }

  async function removeState(state: State) {
    if (
      !confirm(
        `Delete the state “${state.nameEn}”? This is blocked if any city or listing still uses it.`,
      )
    ) {
      return;
    }
    setDeletingState(state.id);
    try {
      await api.deleteState(state.id);
      states.setData((current) =>
        current ? current.filter((s) => s.id !== state.id) : current,
      );
      if (openId === state.id) setOpenId(null);
      toast.push('success', `State “${state.nameEn}” deleted.`);
    } catch (err) {
      toast.push('error', errorMessage(err));
    } finally {
      setDeletingState(null);
    }
  }

  const stateRows = states.data ?? [];

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Places</h1>
          <p>
            States and cities landlords pick when posting. Listings are filtered by
            these, and the full address is “area, city, state”. Names are
            auto-translated to the other language.
          </p>
        </div>
      </header>

      <section className="card">
        <form className="row-actions" onSubmit={createState}>
          <input
            className="input"
            placeholder={lang === 'ar' ? 'اسم الولاية الجديدة…' : 'New state name…'}
            value={stateName}
            maxLength={80}
            onChange={(e) => setStateName(e.target.value)}
            dir={dir}
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={creatingState || !stateName.trim()}
          >
            {creatingState ? 'Adding…' : 'Add state'}
          </button>
        </form>
      </section>

      <section className="card">
        {states.loading && <Spinner label="Loading states" />}
        {!states.loading && states.error && (
          <ErrorState message={states.error} onRetry={states.reload} />
        )}
        {!states.loading && !states.error && stateRows.length === 0 && (
          <EmptyState
            title="No states yet"
            description="Add your first state using the form above."
          />
        )}

        {!states.loading && !states.error && stateRows.length > 0 && (
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
                {stateRows.map((state) => {
                  const open = openId === state.id;
                  return (
                    <Fragment key={state.id}>
                      <tr className={open ? 'is-selected' : undefined}>
                        <td>
                          <strong>{state.nameEn}</strong>
                        </td>
                        <td dir="rtl" lang="ar">
                          {state.nameAr}
                        </td>
                        <td className="nowrap muted">{formatDate(state.createdAt)}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn--secondary btn--sm"
                              aria-expanded={open}
                              onClick={() => setOpenId(open ? null : state.id)}
                            >
                              {open ? 'Hide cities' : 'Manage cities'}
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger-ghost btn--sm"
                              disabled={deletingState === state.id}
                              onClick={() => removeState(state)}
                            >
                              {deletingState === state.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {open && (
                        <tr className="subrow">
                          <td colSpan={4}>
                            <CitiesPanel state={state} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function CitiesPanel({ state }: { state: State }) {
  const toast = useToast();
  const { lang } = usePrefs();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(() => api.cities(state.id), [state.id]);
  const { data, loading, error, reload, setData } = useAsync(load, [state.id, lang]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const created = await api.createCity(trimmed, state.id);
      setData((current) => (current ? [...current, created] : [created]));
      setName('');
      toast.push('success', `City “${created.name}” added to ${state.nameEn}.`);
    } catch (err) {
      toast.push('error', errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string, label: string) {
    if (
      !confirm(
        `Delete the city “${label}”? This is blocked if any listing still uses it.`,
      )
    ) {
      return;
    }
    setDeleting(id);
    try {
      await api.deleteCity(id);
      setData((current) => (current ? current.filter((c) => c.id !== id) : current));
      toast.push('success', `City “${label}” deleted.`);
    } catch (err) {
      toast.push('error', errorMessage(err));
    } finally {
      setDeleting(null);
    }
  }

  const rows = data ?? [];

  return (
    <div className="cities-panel">
      <div className="cities-panel__head">
        <strong>Cities in {state.nameEn}</strong>
        {!loading && !error && <span className="muted">{rows.length} total</span>}
      </div>

      <form className="row-actions" onSubmit={create}>
        <input
          className="input"
          placeholder={lang === 'ar' ? 'اسم المدينة الجديدة…' : 'New city name…'}
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          dir={dir}
        />
        <button
          type="submit"
          className="btn btn--primary btn--sm"
          disabled={creating || !name.trim()}
        >
          {creating ? 'Adding…' : 'Add city'}
        </button>
      </form>

      {loading && <Spinner label="Loading cities" />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState
          title="No cities yet"
          description={`Add the first city in ${state.nameEn} using the form above.`}
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
              {rows.map((city) => (
                <tr key={city.id}>
                  <td>
                    <strong>{city.nameEn}</strong>
                  </td>
                  <td dir="rtl" lang="ar">
                    {city.nameAr}
                  </td>
                  <td className="nowrap muted">{formatDate(city.createdAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--danger-ghost btn--sm"
                      disabled={deleting === city.id}
                      onClick={() => remove(city.id, city.nameEn)}
                    >
                      {deleting === city.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
