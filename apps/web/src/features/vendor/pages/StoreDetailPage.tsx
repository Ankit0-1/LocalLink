import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { routePaths } from '../../../app/routePaths';
import {
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  EmptyState,
  Input,
  SkeletonList,
  StatusBadge,
  Tabs,
  useToast,
} from '../../../components/ui';
import { MapPinIcon, PlusIcon, SearchIcon, StoreIcon } from '../../../components/ui/icons';
import { ApiError } from '../../../lib/apiClient';
import { getSocket } from '../../../lib/socket';
import {
  acceptOrder,
  createProduct,
  deleteProduct,
  deleteStore,
  listOrders,
  listProducts,
  listStores,
  markOrderPreparing,
  markOrderReadyForPickup,
  rejectOrder,
  updateProduct,
  updateStore,
} from '../api';
import type { Order, Product, ProductPayload, Store, StorePayload } from '../types';
import { ProductFormDrawer } from '../components/ProductFormDrawer';
import { StoreFormDrawer } from '../components/StoreFormDrawer';

const emptyProduct: ProductPayload = { name: '', price: 0, description: '', image: '' };

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function storeToPayload(store: Store): StorePayload {
  return { name: store.name, description: store.description ?? '', address: store.address ?? '', image: store.image ?? '' };
}

export function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [productQuery, setProductQuery] = useState('');

  const [isEditStoreOpen, setIsEditStoreOpen] = useState(false);
  const [storeForm, setStoreForm] = useState<StorePayload>({ name: '', description: '', address: '', image: '' });
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeactivatingStore, setIsDeactivatingStore] = useState(false);

  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductPayload>(emptyProduct);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [deactivatingProductId, setDeactivatingProductId] = useState<string | null>(null);

  function loadAll() {
    if (!storeId) return Promise.resolve();
    return Promise.all([
      listProducts(storeId).then(({ products: nextProducts }) => setProducts(nextProducts)),
      listOrders().then(({ orders: nextOrders }) => setOrders(nextOrders.filter((order) => order.store.id === storeId))),
    ]);
  }

  useEffect(() => {
    if (!storeId) return;
    setIsLoading(true);
    // Store list endpoint is the only source of full store fields; find this store from it.
    listStores().then(({ stores }) => {
      const match = stores.find((item) => item.id === storeId) ?? null;
      setStore(match);
    });
    loadAll()
      .catch((err) => toast({ title: 'Could not load store', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, [storeId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    function handleOrderUpdated() {
      loadAll().catch(() => {});
    }
    socket.on('order:updated', handleOrderUpdated);
    return () => {
      socket.off('order:updated', handleOrderUpdated);
    };
  }, [storeId]);

  function openEditStore() {
    if (!store) return;
    setStoreForm(storeToPayload(store));
    setIsEditStoreOpen(true);
  }

  async function submitStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storeId) return;
    setIsSavingStore(true);
    try {
      const { store: updated } = await updateStore(storeId, storeForm);
      setStore(updated);
      setIsEditStoreOpen(false);
      toast({ title: 'Store updated', variant: 'success' });
    } catch (err) {
      toast({ title: 'Could not save the store', description: messageFor(err, 'Please try again.'), variant: 'error' });
    } finally {
      setIsSavingStore(false);
    }
  }

  async function confirmDeactivateStore() {
    if (!storeId) return;
    setIsDeactivatingStore(true);
    try {
      await deleteStore(storeId);
      toast({ title: 'Store deactivated', variant: 'success' });
      navigate(routePaths.vendor.stores);
    } catch (err) {
      toast({ title: 'Could not deactivate the store', description: messageFor(err, 'Please try again.'), variant: 'error' });
    } finally {
      setIsDeactivatingStore(false);
      setIsDeactivateOpen(false);
    }
  }

  function openAddProduct() {
    setEditingProductId(null);
    setProductForm(emptyProduct);
    setIsProductDrawerOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm({ name: product.name, price: Number(product.price), description: product.description ?? '', image: product.image ?? '' });
    setIsProductDrawerOpen(true);
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storeId) return;
    setIsSavingProduct(true);
    try {
      if (editingProductId) await updateProduct(editingProductId, productForm);
      else await createProduct(storeId, productForm);
      const { products: nextProducts } = await listProducts(storeId);
      setProducts(nextProducts);
      setIsProductDrawerOpen(false);
      toast({ title: editingProductId ? 'Product updated' : 'Product added', variant: 'success' });
    } catch (err) {
      toast({ title: 'Could not save the product', description: messageFor(err, 'Please try again.'), variant: 'error' });
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function confirmDeactivateProduct() {
    if (!deactivatingProductId) return;
    const productId = deactivatingProductId;
    try {
      await deleteProduct(productId);
      setProducts((current) => current.map((product) => (product.id === productId ? { ...product, isActive: false } : product)));
      toast({ title: 'Product deactivated', variant: 'success' });
    } catch (err) {
      toast({ title: 'Could not deactivate the product', description: messageFor(err, 'Please try again.'), variant: 'error' });
    } finally {
      setDeactivatingProductId(null);
    }
  }

  async function handleOrderAction(orderId: string, action: (orderId: string) => Promise<{ order: Order }>) {
    try {
      await action(orderId);
      await loadAll();
    } catch (err) {
      toast({ title: 'Could not update the order', description: messageFor(err, 'Please try again.'), variant: 'error' });
    }
  }

  if (isLoading) return <SkeletonList rows={5} />;
  if (!store) return <EmptyState title="Store not found" description="It may have been removed." />;

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(productQuery.trim().toLowerCase()));

  return (
    <section>
      <Breadcrumbs items={[{ label: 'My Store', to: routePaths.vendor.stores }, { label: store.name }]} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
            <StoreIcon className="h-6 w-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">{store.name}</h1>
              <Badge tone={store.isActive ? 'success' : 'neutral'}>{store.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <MapPinIcon className="h-3.5 w-3.5" />
              {store.address ?? 'No address listed'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openEditStore}>Edit store</Button>
          {store.isActive && (
            <Button variant="danger" onClick={() => setIsDeactivateOpen(true)}>Deactivate</Button>
          )}
        </div>
      </div>

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'overview', label: 'Overview' },
          { value: 'products', label: `Products (${products.length})` },
          { value: 'orders', label: `Orders (${orders.length})` },
          { value: 'settings', label: 'Settings' },
        ]}
      />

      {tab === 'overview' && (
        <Card>
          <CardBody className="flex flex-col gap-4 p-5 text-sm">
            <div>
              <p className="text-[var(--text-tertiary)]">Description</p>
              <p className="mt-0.5 text-[var(--text-primary)]">{store.description ?? 'No description yet.'}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[var(--text-tertiary)]">Products</p>
                <p className="mt-0.5 text-lg font-semibold text-[var(--text-primary)]">{products.length}</p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)]">Orders</p>
                <p className="mt-0.5 text-lg font-semibold text-[var(--text-primary)]">{orders.length}</p>
              </div>
              <div>
                <p className="text-[var(--text-tertiary)]">Pending</p>
                <p className="mt-0.5 text-lg font-semibold text-[var(--text-primary)]">{orders.filter((o) => o.status === 'PENDING').length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === 'products' && (
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-xs flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <Input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Search products" className="pl-9" />
            </div>
            <Button onClick={openAddProduct}>
              <PlusIcon className="h-4 w-4" />
              Add product
            </Button>
          </div>
          {filteredProducts.length === 0 ? (
            <EmptyState title="No products yet" description="Add a product to start selling." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-sm">
                  <div className="flex h-24 items-center justify-center bg-[var(--surface-sunken)] text-[var(--text-tertiary)]">
                    {product.image ? <img src={product.image} alt="" className="h-full w-full object-cover" /> : <StoreIcon className="h-7 w-7" />}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-medium text-[var(--text-primary)]">{product.name}</strong>
                        {!product.isActive && <Badge tone="neutral">Inactive</Badge>}
                      </div>
                      <div className="mt-0.5 text-sm text-[var(--text-secondary)]">₹{Number(product.price).toFixed(2)}</div>
                    </div>
                    <div className="mt-auto flex gap-2">
                      <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEditProduct(product)}>Edit</Button>
                      {product.isActive && (
                        <Button size="sm" variant="danger" onClick={() => setDeactivatingProductId(product.id)}>Deactivate</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="flex flex-col gap-2">
          {orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Orders for this store will appear here." />
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong className="text-sm font-medium text-[var(--text-primary)]">{order.customer.name}</strong>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <span className="text-sm text-[var(--text-secondary)]">₹{Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {order.status === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={() => void handleOrderAction(order.id, acceptOrder)}>Accept</Button>
                      <Button size="sm" variant="danger" onClick={() => void handleOrderAction(order.id, rejectOrder)}>Reject</Button>
                    </>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <Button size="sm" onClick={() => void handleOrderAction(order.id, markOrderPreparing)}>Start preparing</Button>
                  )}
                  {order.status === 'PREPARING' && (
                    <Button size="sm" onClick={() => void handleOrderAction(order.id, markOrderReadyForPickup)}>Ready for pickup</Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'settings' && (
        <Card>
          <CardBody className="flex flex-col gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Store details</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Update your store name, description, address, and image.</p>
              <Button variant="secondary" className="mt-3" onClick={openEditStore}>Edit store details</Button>
            </div>
            <div className="h-px bg-[var(--border-subtle)]" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Danger zone</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Deactivating hides this store and its products from customers immediately.
              </p>
              {store.isActive && (
                <Button variant="danger" className="mt-3" onClick={() => setIsDeactivateOpen(true)}>Deactivate store</Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <StoreFormDrawer
        open={isEditStoreOpen}
        onClose={() => setIsEditStoreOpen(false)}
        title="Edit store"
        values={storeForm}
        onChange={setStoreForm}
        onSubmit={submitStore}
        isSubmitting={isSavingStore}
        submitLabel="Save store"
      />

      <ProductFormDrawer
        open={isProductDrawerOpen}
        onClose={() => setIsProductDrawerOpen(false)}
        title={editingProductId ? 'Edit product' : 'Add product'}
        values={productForm}
        onChange={setProductForm}
        onSubmit={submitProduct}
        isSubmitting={isSavingProduct}
        submitLabel={editingProductId ? 'Save product' : 'Add product'}
      />

      <ConfirmDialog
        open={isDeactivateOpen}
        title="Deactivate this store?"
        description="Its products will no longer be visible to customers."
        confirmLabel="Deactivate"
        isSubmitting={isDeactivatingStore}
        onConfirm={() => void confirmDeactivateStore()}
        onCancel={() => setIsDeactivateOpen(false)}
      />

      <ConfirmDialog
        open={deactivatingProductId !== null}
        title="Deactivate this product?"
        confirmLabel="Deactivate"
        onConfirm={() => void confirmDeactivateProduct()}
        onCancel={() => setDeactivatingProductId(null)}
      />
    </section>
  );
}
