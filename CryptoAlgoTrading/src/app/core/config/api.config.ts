/**
 * Centralized API Configuration
 * All API endpoints are defined here for easy maintenance and updates
 */

export const API_CONFIG = {
  base_url: 'https://api.india.delta.exchange',

  // API Endpoints
  endpoints: {
    // Authentication & Account
    account: '/v2/account',
    accounts: '/v2/accounts',

    // Products
    products: '/v2/products',
    product: (id: number) => `/v2/products/${id}`,

    // Orders
    orders: '/v2/orders',
    order: (id: string) => `/v2/orders/${id}`,
    orderByClientId: (clientId: string) => `/v2/orders/client_order_id/${clientId}`,
    placeOrder: '/v2/orders',
    cancelOrder: (id: string) => `/v2/orders/${id}`,

    // Positions
    positions: '/v2/positions',
    position: (id: number) => `/v2/positions/${id}`,

    // Fills
    fills: '/v2/fills',

    // Tickers & Market Data
    ticker: (symbol: string) => `/v2/tickers?symbol=${symbol}`,
    tickers: '/v2/tickers',

    // Leverage/Margin
    leverages: '/v2/leverages',
    leverage: (productId: number) => `/v2/leverages?product_id=${productId}`,
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: 50000,
    maxPageSize: 50000,
  },

  // Rate limiting
  rateLimiting: {
    requestsPerSecond: 10,
    requestTimeoutMs: 30000,
  },

  // Feature flags / Defaults
  features: {
    enableDebugLogging: false,
    enableDetailedLogging: false,
  },
};

/**
 * Get full URL for endpoint
 */
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.base_url}${endpoint}`;
}
