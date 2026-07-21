import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { routePaths } from '../../../app/routePaths';
import { Badge, EmptyState, Input, SkeletonList, useToast } from '../../../components/ui';
import { MapPinIcon, SearchIcon, StoreIcon } from '../../../components/ui/icons';
import { ApiError } from '../../../lib/apiClient';
import { useAuth } from '../../auth/AuthContext';
import { listStores } from '../api';
import type { Store } from '../types';
import { CartSummaryBar } from '../components/CartSummaryBar';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    listStores()
      .then(({ stores: nextStores }) => setStores(nextStores))
      .catch((err) => toast({ title: 'Could not load stores', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredStores = stores.filter((store) => store.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          Hey {user?.name?.split(' ')[0]}, what are you shopping for today?
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Browse local stores and get it delivered fast.</p>
      </div>

      <div className="relative mb-6 max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stores" className="pl-9" />
      </div>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : filteredStores.length === 0 ? (
        <EmptyState
          icon={<StoreIcon className="h-8 w-8" />}
          title={query ? 'No stores match your search' : 'No stores available yet'}
          description={query ? 'Try a different search term.' : 'Check back soon for local stores.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStores.map((store) => (
            <Link
              key={store.id}
              to={routePaths.customer.storeDetail(store.id)}
              className="group overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-400 dark:from-brand-500/15 dark:to-brand-500/5">
                {store.image ? (
                  <img src={store.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <StoreIcon className="h-10 w-10" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {store.name}
                  </h3>
                  <Badge tone={store.isActive ? 'success' : 'neutral'}>{store.isActive ? 'Open' : 'Closed'}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
                  {store.description ?? 'A fresh selection of local products.'}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                  <MapPinIcon className="h-3.5 w-3.5" />
                  {store.address ?? 'No address listed'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CartSummaryBar />
    </section>
  );
}
