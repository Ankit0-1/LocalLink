import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { routePaths } from '../../../app/routePaths';
import { Badge, Breadcrumbs, Button, EmptyState, Input, SkeletonList, useToast } from '../../../components/ui';
import { MapPinIcon, SearchIcon, StoreIcon } from '../../../components/ui/icons';
import { ApiError } from '../../../lib/apiClient';
import { getStore } from '../api';
import type { StoreDetail } from '../types';
import { useCart } from '../CartContext';
import { CartSummaryBar } from '../components/CartSummaryBar';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function StorePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { toast } = useToast();
  const { addProduct } = useCart();
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [quantityByProduct, setQuantityByProduct] = useState<Record<string, number>>({});
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    setIsLoading(true);
    getStore(storeId)
      .then(({ store: nextStore }) => setStore(nextStore))
      .catch((err) => toast({ title: 'Could not load store', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, [storeId]);

  async function handleAddToCart(productId: string) {
    const product = store?.products.find((item) => item.id === productId);
    if (!product) return;
    setAddingProductId(productId);
    await addProduct(product, quantityByProduct[productId] ?? 1);
    setAddingProductId(null);
  }

  if (isLoading) {
    return <SkeletonList rows={5} />;
  }

  if (!store) {
    return <EmptyState title="Store not found" description="It may have been removed or is no longer available." />;
  }

  const filteredProducts = store.products.filter((product) => product.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section>
      <Breadcrumbs items={[{ label: 'Stores', to: routePaths.customer.home }, { label: store.name }]} />

      <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-sm">
        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 text-brand-400 dark:from-brand-500/15 dark:to-brand-500/5">
          {store.image ? <img src={store.image} alt="" className="h-full w-full object-cover" /> : <StoreIcon className="h-12 w-12" />}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">{store.name}</h1>
            <Badge tone={store.isActive ? 'success' : 'neutral'}>{store.isActive ? 'Open' : 'Closed'}</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{store.description ?? 'A fresh selection of products from this store.'}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <MapPinIcon className="h-3.5 w-3.5" />
            {store.address ?? 'No address listed'}
          </p>
        </div>
      </div>

      <div className="relative mb-5 max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products in this store" className="pl-9" />
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState title={query ? 'No products match your search' : 'No products yet'} description={query ? 'Try a different search term.' : 'This store has not added any products yet.'} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-sm">
              <div className="flex h-28 items-center justify-center bg-[var(--surface-sunken)] text-[var(--text-tertiary)]">
                {product.image ? <img src={product.image} alt="" className="h-full w-full object-cover" /> : <StoreIcon className="h-8 w-8" />}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <strong className="text-sm font-medium text-[var(--text-primary)]">{product.name}</strong>
                  <div className="mt-0.5 text-sm text-[var(--text-secondary)]">₹{Number(product.price).toFixed(2)}</div>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={quantityByProduct[product.id] ?? 1}
                    onChange={(event) =>
                      setQuantityByProduct((current) => ({ ...current, [product.id]: Number(event.target.value) || 1 }))
                    }
                    className="w-16"
                  />
                  <Button size="sm" className="flex-1" isLoading={addingProductId === product.id} onClick={() => void handleAddToCart(product.id)}>
                    Add to cart
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CartSummaryBar />
    </section>
  );
}
