import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { routePaths } from '../../app/routePaths';
import { ApiError } from '../../lib/apiClient';
import { getSocket } from '../../lib/socket';
import { useAuth } from '../auth/AuthContext';
import { addToCart, checkoutCart, getCart, getOrder, getStore, listOrders, listStores, removeCartItem, updateCartItem } from './api';
import type { Cart, Order, OrderTracking, Product, Store, StoreDetail } from './types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeDetail, setStoreDetail] = useState<StoreDetail | null>(null);
  const [cart, setCart] = useState<Cart>({ id: null, items: [] });
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [quantityByProduct, setQuantityByProduct] = useState<Record<string, number>>({});

  useEffect(() => {
    async function bootstrap() {
      try {
        const [{ stores: nextStores }, { cart: nextCart }, { orders: nextOrders }] = await Promise.all([
          listStores(),
          getCart(),
          listOrders(),
        ]);
        setStores(nextStores);
        setCart(nextCart);
        setOrders(nextOrders);
        if (nextStores[0]) {
          setSelectedStoreId(nextStores[0].id);
        }
      } catch (err) {
        setError(messageFor(err, 'Could not load customer dashboard.'));
      } finally {
        setIsLoading(false);
      }
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedStoreId) {
      setStoreDetail(null);
      return;
    }

    getStore(selectedStoreId)
      .then(({ store }) => setStoreDetail(store))
      .catch((err) => setError(messageFor(err, 'Could not load store details.')));
  }, [selectedStoreId]);

  useEffect(() => {
    if (!trackingOrderId) {
      setTrackingOrder(null);
      return;
    }
    getOrder(trackingOrderId)
      .then(({ order }) => setTrackingOrder(order))
      .catch((err) => setError(messageFor(err, 'Could not load order tracking.')));
  }, [trackingOrderId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleOrderUpdated() {
      listOrders()
        .then(({ orders: nextOrders }) => setOrders(nextOrders))
        .catch((err) => setError(messageFor(err, 'Could not refresh your orders.')));
      if (trackingOrderId) {
        getOrder(trackingOrderId)
          .then(({ order }) => setTrackingOrder(order))
          .catch((err) => setError(messageFor(err, 'Could not refresh order tracking.')));
      }
    }

    socket.on('order:updated', handleOrderUpdated);
    return () => {
      socket.off('order:updated', handleOrderUpdated);
    };
  }, [trackingOrderId]);

  const cartTotal = useMemo(() => {
    return cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  }, [cart.items]);

  async function handleAddToCart(product: Product) {
    setError(null);
    setSuccess(null);
    try {
      const { cart: nextCart } = await addToCart(product.id, quantityByProduct[product.id] ?? 1);
      setCart(nextCart);
      setSuccess(`Added ${product.name} to cart.`);
    } catch (err) {
      setError(messageFor(err, 'Could not add product to cart.'));
    }
  }

  async function handleQuantityChange(itemId: string, quantity: number) {
    if (quantity < 0) return;
    try {
      const { cart: nextCart } = await updateCartItem(itemId, quantity);
      setCart(nextCart);
      setSuccess('Cart updated.');
    } catch (err) {
      setError(messageFor(err, 'Could not update cart.'));
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      await removeCartItem(itemId);
      const { cart: nextCart } = await getCart();
      setCart(nextCart);
      setSuccess('Item removed from cart.');
    } catch (err) {
      setError(messageFor(err, 'Could not remove cart item.'));
    }
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const { order } = await checkoutCart();
      const { orders: nextOrders } = await listOrders();
      setOrders(nextOrders);
      setCart({ id: null, items: [] });
      setSuccess(`Order ${order.id.slice(0, 8)} created successfully.`);
    } catch (err) {
      setError(messageFor(err, 'Could not place order.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div><h2>Customer dashboard</h2><p>Welcome, {user?.name}</p></div>
        <button onClick={() => { logout(); navigate(routePaths.login, { replace: true }); }}>Log out</button>
      </header>
      {error && <p role="alert" className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      {isLoading ? <p>Loading marketplace…</p> : <div className="dashboard-grid">
        <div>
          <h3>Stores</h3>
          <ul className="item-list">
            {stores.map((store) => (
              <li key={store.id} className={selectedStoreId === store.id ? 'selected' : ''}>
                <button className="link-button" onClick={() => setSelectedStoreId(store.id)}>{store.name}</button>
                <small>{store.address ?? 'No address listed'}</small>
              </li>
            ))}
          </ul>
          {storeDetail && <div>
            <h3>{storeDetail.name}</h3>
            <p>{storeDetail.description ?? 'A fresh selection of products from this store.'}</p>
            <ul className="item-list">
              {storeDetail.products.map((product) => (
                <li key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <div>₹{Number(product.price).toFixed(2)}</div>
                  </div>
                  <div className="form-stack">
                    <input type="number" min="1" value={quantityByProduct[product.id] ?? 1} onChange={(event) => setQuantityByProduct((current) => ({ ...current, [product.id]: Number(event.target.value) || 1 }))} />
                    <button onClick={() => void handleAddToCart(product)}>Add to cart</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>}
        </div>
        <div>
          <h3>Your cart</h3>
          {cart.items.length === 0 ? <p>Your cart is empty.</p> : <>
            <ul className="item-list">
              {cart.items.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.product.name}</strong>
                    <div>₹{(Number(item.product.price) * item.quantity).toFixed(2)}</div>
                  </div>
                  <div className="form-stack">
                    <input type="number" min="1" value={item.quantity} onChange={(event) => void handleQuantityChange(item.id, Number(event.target.value))} />
                    <button onClick={() => void handleRemoveItem(item.id)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            <p><strong>Total:</strong> ₹{cartTotal.toFixed(2)}</p>
            <form onSubmit={handleCheckout} className="form-stack">
              <button type="submit" disabled={isSubmitting}>Checkout</button>
            </form>
          </>}
          <h3>Order history</h3>
          <ul className="item-list">
            {orders.map((order) => (
              <li key={order.id}>
                <div>
                  <strong>{order.store.name}</strong>
                  <div>{order.status}</div>
                </div>
                <div>₹{Number(order.total).toFixed(2)}</div>
                <button onClick={() => setTrackingOrderId((current) => (current === order.id ? null : order.id))}>
                  {trackingOrderId === order.id ? 'Hide tracking' : 'Track'}
                </button>
              </li>
            ))}
          </ul>
          {trackingOrder && <div>
            <h3>Tracking order {trackingOrder.id.slice(0, 8)}</h3>
            <p><strong>Status:</strong> {trackingOrder.status}</p>
            <p>{trackingOrder.store.name} — {trackingOrder.store.address ?? 'No address listed'}</p>
            <p>
              {trackingOrder.deliveryPartner
                ? `Delivery partner: ${trackingOrder.deliveryPartner.name}${trackingOrder.deliveryPartner.phone ? ` (${trackingOrder.deliveryPartner.phone})` : ''}`
                : 'No delivery partner assigned yet.'}
            </p>
          </div>}
        </div>
      </div>}
    </section>
  );
}
