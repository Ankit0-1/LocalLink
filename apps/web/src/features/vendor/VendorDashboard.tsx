import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { routePaths } from '../../app/routePaths';
import { ApiError } from '../../lib/apiClient';
import { useAuth } from '../auth/AuthContext';
import {
  acceptOrder,
  createProduct,
  createStore,
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
} from './api';
import type { Order, Product, ProductPayload, Store, StorePayload } from './types';

const emptyStore: StorePayload = { name: '', description: '', address: '', image: '' };
const emptyProduct: ProductPayload = { name: '', price: 0, description: '', image: '' };

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function VendorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeForm, setStoreForm] = useState<StorePayload>(emptyStore);
  const [productForm, setProductForm] = useState<ProductPayload>(emptyProduct);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStores() {
    const { stores: nextStores } = await listStores();
    setStores(nextStores);
    setSelectedStoreId((current) => current && nextStores.some((store) => store.id === current) ? current : nextStores[0]?.id ?? null);
  }

  async function loadOrders() {
    const { orders: nextOrders } = await listOrders();
    setOrders(nextOrders);
  }

  useEffect(() => {
    loadStores().catch((err) => setError(messageFor(err, 'Could not load your stores.'))).finally(() => setIsLoading(false));
    loadOrders().catch((err) => setError(messageFor(err, 'Could not load your orders.')));
  }, []);

  useEffect(() => {
    if (!selectedStoreId) {
      setProducts([]);
      return;
    }
    listProducts(selectedStoreId)
      .then(({ products: nextProducts }) => setProducts(nextProducts))
      .catch((err) => setError(messageFor(err, 'Could not load products.')));
  }, [selectedStoreId]);

  async function submitStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = editingStoreId ? await updateStore(editingStoreId, storeForm) : await createStore(storeForm);
      await loadStores();
      setSelectedStoreId(result.store.id);
      setStoreForm(emptyStore);
      setEditingStoreId(null);
    } catch (err) {
      setError(messageFor(err, 'Could not save the store.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStoreId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      if (editingProductId) await updateProduct(editingProductId, productForm);
      else await createProduct(selectedStoreId, productForm);
      const { products: nextProducts } = await listProducts(selectedStoreId);
      setProducts(nextProducts);
      setProductForm(emptyProduct);
      setEditingProductId(null);
    } catch (err) {
      setError(messageFor(err, 'Could not save the product.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeStore(storeId: string) {
    if (!window.confirm('Deactivate this store? Its products will no longer be visible to customers.')) return;
    try {
      await deleteStore(storeId);
      await loadStores();
    } catch (err) {
      setError(messageFor(err, 'Could not deactivate the store.'));
    }
  }

  async function removeProduct(productId: string) {
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await deleteProduct(productId);
      setProducts((current) => current.map((product) => product.id === productId ? { ...product, isActive: false } : product));
    } catch (err) {
      setError(messageFor(err, 'Could not deactivate the product.'));
    }
  }

  function startStoreEdit(store: Store) {
    setEditingStoreId(store.id);
    setStoreForm({ name: store.name, description: store.description ?? '', address: store.address ?? '', image: store.image ?? '' });
  }

  function startProductEdit(product: Product) {
    setEditingProductId(product.id);
    setProductForm({ name: product.name, price: Number(product.price), description: product.description ?? '', image: product.image ?? '' });
  }

  async function handleOrderAction(orderId: string, action: (orderId: string) => Promise<{ order: Order }>) {
    try {
      await action(orderId);
      await loadOrders();
    } catch (err) {
      setError(messageFor(err, 'Could not update the order.'));
    }
  }

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div><h2>Vendor dashboard</h2><p>Welcome, {user?.name}</p></div>
        <button onClick={() => { logout(); navigate(routePaths.login, { replace: true }); }}>Log out</button>
      </header>
      {error && <p role="alert" className="error">{error}</p>}
      {isLoading ? <p>Loading your stores…</p> : <div className="dashboard-grid">
        <div>
          <h3>{editingStoreId ? 'Edit store' : 'Create a store'}</h3>
          <form onSubmit={submitStore} className="form-stack">
            <label>Store name<input value={storeForm.name} onChange={(event) => setStoreForm({ ...storeForm, name: event.target.value })} required /></label>
            <label>Description<textarea value={storeForm.description} onChange={(event) => setStoreForm({ ...storeForm, description: event.target.value })} /></label>
            <label>Address<textarea value={storeForm.address} onChange={(event) => setStoreForm({ ...storeForm, address: event.target.value })} /></label>
            <label>Image URL<input type="url" value={storeForm.image} onChange={(event) => setStoreForm({ ...storeForm, image: event.target.value })} /></label>
            <div><button type="submit" disabled={isSubmitting}>{editingStoreId ? 'Save store' : 'Create store'}</button>{editingStoreId && <button type="button" onClick={() => { setEditingStoreId(null); setStoreForm(emptyStore); }}>Cancel</button>}</div>
          </form>
          <h3>Your stores</h3>
          <ul className="item-list">{stores.map((store) => <li key={store.id} className={selectedStoreId === store.id ? 'selected' : ''}>
            <button className="link-button" onClick={() => setSelectedStoreId(store.id)}>{store.name}</button> {!store.isActive && <small>Inactive</small>}
            <div><button onClick={() => startStoreEdit(store)}>Edit</button>{store.isActive && <button onClick={() => removeStore(store.id)}>Deactivate</button>}</div>
          </li>)}</ul>
        </div>
        <div>
          <h3>{selectedStoreId ? (editingProductId ? 'Edit product' : 'Add product') : 'Select a store'}</h3>
          {selectedStoreId && <form onSubmit={submitProduct} className="form-stack">
            <label>Product name<input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required /></label>
            <label>Price<input type="number" min="0.01" step="0.01" value={productForm.price || ''} onChange={(event) => setProductForm({ ...productForm, price: Number(event.target.value) })} required /></label>
            <label>Description<textarea value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label>
            <label>Image URL<input type="url" value={productForm.image} onChange={(event) => setProductForm({ ...productForm, image: event.target.value })} /></label>
            <div><button type="submit" disabled={isSubmitting}>{editingProductId ? 'Save product' : 'Add product'}</button>{editingProductId && <button type="button" onClick={() => { setEditingProductId(null); setProductForm(emptyProduct); }}>Cancel</button>}</div>
          </form>}
          {selectedStoreId && <><h3>Products</h3><ul className="item-list">{products.map((product) => <li key={product.id}>
            <strong>{product.name}</strong> — ₹{Number(product.price).toFixed(2)} {!product.isActive && <small>Inactive</small>}
            <div><button onClick={() => startProductEdit(product)}>Edit</button>{product.isActive && <button onClick={() => removeProduct(product.id)}>Deactivate</button>}</div>
          </li>)}</ul></>}
        </div>
        <div>
          <h3>Orders</h3>
          {orders.length === 0 ? <p>No orders yet.</p> : <ul className="item-list">{orders.map((order) => <li key={order.id}>
            <div>
              <strong>{order.store.name}</strong> — {order.customer.name}
              <div>{order.status} · ₹{Number(order.total).toFixed(2)}</div>
            </div>
            <div>
              {order.status === 'PENDING' && <>
                <button onClick={() => void handleOrderAction(order.id, acceptOrder)}>Accept</button>
                <button onClick={() => void handleOrderAction(order.id, rejectOrder)}>Reject</button>
              </>}
              {order.status === 'ACCEPTED' && <button onClick={() => void handleOrderAction(order.id, markOrderPreparing)}>Start preparing</button>}
              {order.status === 'PREPARING' && <button onClick={() => void handleOrderAction(order.id, markOrderReadyForPickup)}>Ready for pickup</button>}
            </div>
          </li>)}</ul>}
        </div>
      </div>}
    </section>
  );
}
