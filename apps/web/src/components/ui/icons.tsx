import type { ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

function base(children: ReactNode) {
  return function Icon(props: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

export const HomeIcon = base(<path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />);

export const StoreIcon = base(
  <>
    <path d="M4 9V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3" />
    <path d="M3 9h18l-1.2 3.6a2 2 0 0 1-1.9 1.4H6.1a2 2 0 0 1-1.9-1.4L3 9Z" />
    <path d="M5 14v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6M10 21v-4h4v4" />
  </>,
);

export const CartIcon = base(
  <>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2.5 3h2l2.4 12.2a1.6 1.6 0 0 0 1.58 1.3h9.24a1.6 1.6 0 0 0 1.58-1.3L21 7.5H6" />
  </>,
);

export const OrdersIcon = base(
  <>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </>,
);

export const UserIcon = base(
  <>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </>,
);

export const DashboardIcon = base(
  <>
    <rect x="3.5" y="3.5" width="7" height="8" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
    <rect x="3.5" y="14.5" width="7" height="6" rx="1.5" />
  </>,
);

export const PackageIcon = base(
  <>
    <path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16Z" />
    <path d="M3.7 8 12 12.3 20.3 8M12 12.3V20.5" />
  </>,
);

export const SettingsIcon = base(
  <>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 13.5a1.8 1.8 0 0 0 .36 1.98l.06.06a2.2 2.2 0 1 1-3.1 3.1l-.07-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.65V20a2.2 2.2 0 1 1-4.4 0v-.1a1.8 1.8 0 0 0-1.18-1.65 1.8 1.8 0 0 0-1.98.36l-.06.06a2.2 2.2 0 1 1-3.1-3.1l.06-.07a1.8 1.8 0 0 0 .36-1.98 1.8 1.8 0 0 0-1.65-1.1H2.5a2.2 2.2 0 1 1 0-4.4h.1a1.8 1.8 0 0 0 1.65-1.18 1.8 1.8 0 0 0-.36-1.98l-.06-.06a2.2 2.2 0 1 1 3.1-3.1l.07.06a1.8 1.8 0 0 0 1.98.36H9a1.8 1.8 0 0 0 1.1-1.65V2.5a2.2 2.2 0 1 1 4.4 0v.1a1.8 1.8 0 0 0 1.1 1.65 1.8 1.8 0 0 0 1.98-.36l.06-.06a2.2 2.2 0 1 1 3.1 3.1l-.06.07a1.8 1.8 0 0 0-.36 1.98V9a1.8 1.8 0 0 0 1.65 1.1h.1a2.2 2.2 0 1 1 0 4.4h-.1a1.8 1.8 0 0 0-1.65 1.1Z" />
  </>,
);

export const ChartIcon = base(
  <>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </>,
);

export const TruckIcon = base(
  <>
    <rect x="1.5" y="7" width="12" height="9" rx="1.2" />
    <path d="M13.5 10h4l3 3v3h-7v-6Z" />
    <circle cx="6" cy="18.2" r="1.6" />
    <circle cx="16.8" cy="18.2" r="1.6" />
  </>,
);

export const HistoryIcon = base(
  <>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4h4" />
    <path d="M12 8v4.5l3 2" />
  </>,
);

export const BellIcon = base(
  <>
    <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
    <path d="M10 18.5a2 2 0 0 0 4 0" />
  </>,
);

export const ChevronDownIcon = base(<path d="m6 9 6 6 6-6" />);
export const ChevronRightIcon = base(<path d="m9 6 6 6-6 6" />);
export const MenuIcon = base(<path d="M4 7h16M4 12h16M4 17h16" />);
export const CloseIcon = base(<path d="M6 6l12 12M18 6 6 18" />);
export const SearchIcon = base(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" />
  </>,
);
export const FilterIcon = base(<path d="M4 5h16M7 12h10M10 19h4" />);
export const PlusIcon = base(<path d="M12 5v14M5 12h14" />);
export const CheckCircleIcon = base(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5.5" />
  </>,
);
export const AlertCircleIcon = base(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </>,
);
export const MapPinIcon = base(
  <>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.3" />
  </>,
);
export const WalletIcon = base(
  <>
    <rect x="2.5" y="6" width="19" height="13" rx="2" />
    <path d="M2.5 10h19" />
    <circle cx="17.5" cy="14" r="1.2" />
  </>,
);
