import { Link } from 'react-router-dom';
import { routePaths } from '../../../app/routePaths';
import { buttonClasses } from '../../../components/ui';
import { useCart } from '../CartContext';

export function CartSummaryBar() {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="sticky bottom-16 z-10 mt-6 flex items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-600 px-5 py-3.5 text-white shadow-lg animate-fade-in dark:border-brand-800 sm:bottom-4">
      <p className="text-sm">
        {itemCount} item{itemCount === 1 ? '' : 's'} ·{' '}
        <span>
          <strong>Total:</strong> ₹{total.toFixed(2)}
        </span>
      </p>
      <Link to={routePaths.customer.cart} className={buttonClasses('secondary', 'sm', '!bg-white !text-brand-700')}>
        View cart
      </Link>
    </div>
  );
}
