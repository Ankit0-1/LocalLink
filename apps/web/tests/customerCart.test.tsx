import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/lib/apiClient';
import { AuthContext, type AuthContextValue } from '../src/features/auth/AuthContext';
import { CartProvider } from '../src/features/customer/CartContext';
import { StorePage } from '../src/features/customer/pages/StorePage';
import * as customerApi from '../src/features/customer/api';
import { ToastProvider } from '../src/components/ui';
import type { Cart, Store, StoreDetail } from '../src/features/customer/types';

vi.mock('../src/lib/socket', () => ({
  getSocket: () => null,
}));

vi.mock('../src/features/customer/api');

const storeA: Store = { id: 'store-a', name: 'Store A', description: null, address: null, image: null, isActive: true };
const storeB: Store = { id: 'store-b', name: 'Store B', description: null, address: null, image: null, isActive: true };

const productA = {
  id: 'product-a',
  name: 'Widget A',
  price: '10.00',
  description: null,
  image: null,
  isActive: true,
  storeId: storeA.id,
  store: { id: storeA.id, name: storeA.name, isActive: true },
};

const productB = {
  id: 'product-b',
  name: 'Widget B',
  price: '20.00',
  description: null,
  image: null,
  isActive: true,
  storeId: storeB.id,
  store: { id: storeB.id, name: storeB.name, isActive: true },
};

const storeDetailA: StoreDetail = { ...storeA, products: [productA] };
const storeDetailB: StoreDetail = { ...storeB, products: [productB] };

const cartWithStoreAItem: Cart = {
  id: 'cart-1',
  items: [{ id: 'cart-item-1', productId: productA.id, quantity: 1, product: productA }],
};

function authValue(): AuthContextValue {
  return {
    user: {
      id: 'customer-1',
      name: 'Test Customer',
      email: 'customer@example.com',
      role: 'CUSTOMER',
      phone: null,
      profileImage: null,
      isActive: true,
      verificationStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
    },
    isAuthenticated: true,
    isInitializing: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  };
}

function renderStorefront() {
  return render(
    <AuthContext.Provider value={authValue()}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/customer/stores/${storeA.id}`]}>
          <CartProvider>
            <nav>
              <Link to={`/customer/stores/${storeA.id}`}>Store A</Link>
              <Link to={`/customer/stores/${storeB.id}`}>Store B</Link>
            </nav>
            <Routes>
              <Route path="/customer/stores/:storeId" element={<StorePage />} />
            </Routes>
          </CartProvider>
        </MemoryRouter>
      </ToastProvider>
    </AuthContext.Provider>,
  );
}

describe('Customer storefront: cross-store cart guard', () => {
  beforeEach(() => {
    vi.mocked(customerApi.listStores).mockResolvedValue({ stores: [storeA, storeB] });
    vi.mocked(customerApi.listOrders).mockResolvedValue({ orders: [] });
    vi.mocked(customerApi.getCart).mockResolvedValue({ cart: cartWithStoreAItem });
    vi.mocked(customerApi.getStore).mockImplementation((storeId: string) =>
      Promise.resolve({ store: storeId === storeA.id ? storeDetailA : storeDetailB }),
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('surfaces the backend mixed-store rejection and leaves the cart unchanged', async () => {
    const user = userEvent.setup();
    vi.mocked(customerApi.addToCart).mockRejectedValue(
      new ApiError(409, 'Your cart already contains items from another store. Please checkout or clear it first.'),
    );

    renderStorefront();

    // Cart already holds an item from Store A (from the mocked getCart()).
    await waitFor(() => expect(screen.getByText('Widget A')).toBeInTheDocument());

    // Navigate to Store B and try to add its product.
    await user.click(screen.getByRole('link', { name: 'Store B' }));
    await waitFor(() => expect(screen.getByText('Widget B')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(
      await screen.findByText('Your cart already contains items from another store. Please checkout or clear it first.'),
    ).toBeInTheDocument();

    // The cart total still reflects only the original Store A item — addToCart's
    // rejection was never applied to local cart state.
    expect(screen.getByText(/Total:/).parentElement).toHaveTextContent('Total: ₹10.00');
    expect(customerApi.addToCart).toHaveBeenCalledTimes(1);
  });

  it('adding a product from the same store already in the cart succeeds', async () => {
    const user = userEvent.setup();
    const updatedCart: Cart = {
      id: 'cart-1',
      items: [{ id: 'cart-item-1', productId: productA.id, quantity: 2, product: productA }],
    };
    vi.mocked(customerApi.addToCart).mockResolvedValue({ cart: updatedCart });

    renderStorefront();

    await waitFor(() => expect(screen.getByText('Widget A')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Add to cart' }));

    expect(await screen.findByText('Added Widget A to cart.')).toBeInTheDocument();
    expect(customerApi.addToCart).toHaveBeenCalledWith(productA.id, 1);
  });
});
