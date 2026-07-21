import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { routePaths } from '../../../app/routePaths';
import { Badge, Button, EmptyState, SkeletonList, useToast } from '../../../components/ui';
import { PlusIcon, StoreIcon } from '../../../components/ui/icons';
import { ApiError } from '../../../lib/apiClient';
import { createStore, listStores } from '../api';
import type { Store, StorePayload } from '../types';
import { StoreFormDrawer } from '../components/StoreFormDrawer';

const emptyStore: StorePayload = { name: '', description: '', address: '', image: '' };

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function StoresPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [storeForm, setStoreForm] = useState<StorePayload>(emptyStore);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadStores() {
    return listStores().then(({ stores: nextStores }) => setStores(nextStores));
  }

  useEffect(() => {
    loadStores()
      .catch((err) => toast({ title: 'Could not load your stores', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  async function submitStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createStore(storeForm);
      await loadStores();
      setStoreForm(emptyStore);
      setIsDrawerOpen(false);
      toast({ title: 'Store created', variant: 'success' });
    } catch (err) {
      toast({ title: 'Could not save the store', description: messageFor(err, 'Please try again.'), variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">My Store</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage your storefronts and their products.</p>
        </div>
        <Button
          onClick={() => {
            setStoreForm(emptyStore);
            setIsDrawerOpen(true);
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Add store
        </Button>
      </div>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : stores.length === 0 ? (
        <EmptyState
          icon={<StoreIcon className="h-8 w-8" />}
          title="No stores yet"
          description="Create your first store to start selling on LocalLink."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Link
              key={store.id}
              to={routePaths.vendor.storeDetail(store.id)}
              className="group overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-28 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-400 dark:from-brand-500/15 dark:to-brand-500/5">
                {store.image ? <img src={store.image} alt="" className="h-full w-full object-cover" /> : <StoreIcon className="h-9 w-9" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-brand-600 dark:group-hover:text-brand-400">{store.name}</h3>
                  <Badge tone={store.isActive ? 'success' : 'neutral'}>{store.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">{store.description ?? 'No description yet.'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <StoreFormDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Add store"
        values={storeForm}
        onChange={setStoreForm}
        onSubmit={submitStore}
        isSubmitting={isSubmitting}
        submitLabel="Create store"
      />
    </section>
  );
}
