import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useToast } from '../../components/ui';
import { ApiError } from '../../lib/apiClient';
import { addToCart as addToCartRequest, checkoutCart as checkoutCartRequest, getCart, removeCartItem, updateCartItem } from './api';
import type { Cart, Order, Product } from './types';

function messageFor(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

interface CartContextValue {
  cart: Cart;
  isLoading: boolean;
  itemCount: number;
  total: number;
  addProduct: (product: Product, quantity: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  checkout: () => Promise<Order | null>;
  isCheckingOut: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [cart, setCart] = useState<Cart>({ id: null, items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    getCart()
      .then(({ cart: nextCart }) => setCart(nextCart))
      .catch((err) => toast({ title: 'Could not load your cart', description: messageFor(err, 'Please try again.'), variant: 'error' }))
      .finally(() => setIsLoading(false));
  }, []);

  const addProduct = useCallback(
    async (product: Product, quantity: number) => {
      try {
        const { cart: nextCart } = await addToCartRequest(product.id, quantity);
        setCart(nextCart);
        toast({ title: `Added ${product.name} to cart.`, variant: 'success' });
        return true;
      } catch (err) {
        toast({ title: 'Could not add product to cart', description: messageFor(err, 'Please try again.'), variant: 'error' });
        return false;
      }
    },
    [toast],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 0) return;
      try {
        const { cart: nextCart } = await updateCartItem(itemId, quantity);
        setCart(nextCart);
      } catch (err) {
        toast({ title: 'Could not update cart', description: messageFor(err, 'Please try again.'), variant: 'error' });
      }
    },
    [toast],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        await removeCartItem(itemId);
        const { cart: nextCart } = await getCart();
        setCart(nextCart);
        toast({ title: 'Item removed from cart.', variant: 'success' });
      } catch (err) {
        toast({ title: 'Could not remove cart item', description: messageFor(err, 'Please try again.'), variant: 'error' });
      }
    },
    [toast],
  );

  const checkout = useCallback(async () => {
    setIsCheckingOut(true);
    try {
      const { order } = await checkoutCartRequest();
      setCart({ id: null, items: [] });
      toast({ title: `Order ${order.id.slice(0, 8)} placed successfully.`, variant: 'success' });
      return order;
    } catch (err) {
      toast({ title: 'Could not place order', description: messageFor(err, 'Please try again.'), variant: 'error' });
      return null;
    } finally {
      setIsCheckingOut(false);
    }
  }, [toast]);

  const itemCount = useMemo(() => cart.items.reduce((sum, item) => sum + item.quantity, 0), [cart.items]);
  const total = useMemo(
    () => cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
    [cart.items],
  );

  const value: CartContextValue = {
    cart,
    isLoading,
    itemCount,
    total,
    addProduct,
    updateQuantity,
    removeItem,
    checkout,
    isCheckingOut,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
