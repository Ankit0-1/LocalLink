import { useNavigate } from 'react-router-dom';
import { routePaths } from '../../../app/routePaths';
import { Button, EmptyState, Input, buttonClasses } from '../../../components/ui';
import { CartIcon } from '../../../components/ui/icons';
import { useCart } from '../CartContext';

export function CartPage() {
  const { cart, total, updateQuantity, removeItem, checkout, isCheckingOut } = useCart();
  const navigate = useNavigate();

  async function handleCheckout() {
    const order = await checkout();
    if (order) navigate(routePaths.customer.orders);
  }

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Your cart</h1>

      {cart.items.length === 0 ? (
        <EmptyState
          icon={<CartIcon className="h-8 w-8" />}
          title="Your cart is empty"
          description="Add products from a store to get started."
          action={
            <a href={routePaths.customer.home} className={buttonClasses('primary', 'sm')}>
              Browse stores
            </a>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-3">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <strong className="text-sm font-medium text-[var(--text-primary)]">{item.product.name}</strong>
                  <div className="text-sm text-[var(--text-secondary)]">₹{(Number(item.product.price) * item.quantity).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => void updateQuantity(item.id, Number(event.target.value))}
                    className="w-20"
                  />
                  <Button size="sm" variant="danger" onClick={() => void removeItem(item.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Order summary</h2>
            <p className="text-sm text-[var(--text-primary)]">
              <strong>Total:</strong> ₹{total.toFixed(2)}
            </p>
            <Button className="mt-4 w-full" isLoading={isCheckingOut} onClick={() => void handleCheckout()}>
              Checkout
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
