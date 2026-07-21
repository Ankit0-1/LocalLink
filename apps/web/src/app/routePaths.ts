export const routePaths = {
  home: '/',
  login: '/login',
  register: '/register',

  vendorDashboard: '/vendor',
  customerDashboard: '/customer',
  deliveryDashboard: '/delivery',
  adminDashboard: '/admin',

  customer: {
    home: '/customer',
    storeDetail: (storeId: string) => `/customer/stores/${storeId}`,
    cart: '/customer/cart',
    orders: '/customer/orders',
    profile: '/customer/profile',
  },

  vendor: {
    dashboard: '/vendor',
    stores: '/vendor/stores',
    storeDetail: (storeId: string) => `/vendor/stores/${storeId}`,
    orders: '/vendor/orders',
    analytics: '/vendor/analytics',
    settings: '/vendor/settings',
  },

  delivery: {
    dashboard: '/delivery',
    available: '/delivery/available',
    active: '/delivery/active',
    history: '/delivery/history',
    profile: '/delivery/profile',
  },

  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    stores: '/admin/stores',
    orders: '/admin/orders',
    deliveryPartners: '/admin/delivery-partners',
  },
} as const;
