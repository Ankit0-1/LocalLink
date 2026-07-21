import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routePaths } from '../../app/routePaths';
import { buttonClasses, Card, CardBody, Input } from '../../components/ui';
import { CartIcon, SearchIcon, StoreIcon, TruckIcon, UserIcon } from '../../components/ui/icons';

function HowItWorksStep({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{index}</span>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(routePaths.register);
  }

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          Local stores, delivered fast
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-5xl">
          Everything from your neighborhood, delivered to your door
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-[var(--text-secondary)]">
          LocalLink connects you with nearby stores, vendors, and delivery partners — order in seconds, track in real time.
        </p>

        <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-md gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stores or products" className="pl-9" />
          </div>
          <button type="submit" className={buttonClasses('primary', 'md')}>
            Search
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to={routePaths.register} className={buttonClasses('primary', 'md')}>
            Get started
          </Link>
          <Link to={routePaths.login} className={buttonClasses('secondary', 'md')}>
            Log in
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardBody className="flex flex-col items-center gap-2 p-6 text-center">
              <StoreIcon className="h-7 w-7 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Shop local</h3>
              <p className="text-sm text-[var(--text-secondary)]">Browse nearby stores and order what you need.</p>
              <Link to={routePaths.register} className="mt-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Start shopping →
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex flex-col items-center gap-2 p-6 text-center">
              <UserIcon className="h-7 w-7 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sell as a vendor</h3>
              <p className="text-sm text-[var(--text-secondary)]">Set up your storefront and manage orders with ease.</p>
              <Link to={routePaths.register} className="mt-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Start selling →
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex flex-col items-center gap-2 p-6 text-center">
              <TruckIcon className="h-7 w-7 text-brand-600 dark:text-brand-400" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Deliver with us</h3>
              <p className="text-sm text-[var(--text-secondary)]">Accept delivery jobs nearby and earn on your schedule.</p>
              <Link to={routePaths.register} className="mt-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Start delivering →
              </Link>
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="border-y border-[var(--border-subtle)] bg-[var(--surface-raised)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight text-[var(--text-primary)]">How it works</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <HowItWorksStep index={1} title="Browse local stores" description="Discover stores and products near you, all in one place." />
            <HowItWorksStep index={2} title="Place your order" description="Add items to your cart and check out in a few taps." />
            <HowItWorksStep index={3} title="Track live delivery" description="Watch your order move from store to doorstep in real time." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <CartIcon className="mx-auto h-8 w-8 text-brand-600 dark:text-brand-400" />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Ready to get started?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
          Join LocalLink today as a customer, vendor, or delivery partner.
        </p>
        <Link to={routePaths.register} className={buttonClasses('primary', 'md', 'mt-6')}>
          Create your account
        </Link>
      </section>

      <footer className="border-t border-[var(--border-subtle)] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-sm text-[var(--text-secondary)] sm:flex-row sm:justify-between sm:px-6">
          <span className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">L</span>
            LocalLink
          </span>
          <p>© {new Date().getFullYear()} LocalLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
