const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('kano_laundry_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  getMe: () => request('/auth/me'),

  // Laundries Directory
  getLaundries: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    return request(`/laundries${qs ? `?${qs}` : ''}`);
  },
  getAreas: () => request('/laundries/areas'),
  getLaundryById: (id) => request(`/laundries/${id}`),

  // Customer Orders
  createOrder: (orderData) => request('/orders', { method: 'POST', body: orderData }),
  getCustomerOrders: () => request('/orders'),
  getOrderById: (id) => request(`/orders/${id}`),
  approvePriceChange: (orderId, requestId) => request(`/orders/${orderId}/approve-price`, { method: 'POST', body: { requestId } }),
  declinePriceChange: (orderId, requestId) => request(`/orders/${orderId}/decline-price`, { method: 'POST', body: { requestId } }),
  cancelOrder: (orderId, reason) => request(`/orders/${orderId}/cancel`, { method: 'POST', body: { reason } }),
  raiseDispute: (orderId, disputeData) => request(`/orders/${orderId}/dispute`, { method: 'POST', body: disputeData }),
  createReview: (orderId, reviewData) => request(`/orders/${orderId}/review`, { method: 'POST', body: reviewData }),

  // Partner Area
  getPartnerOrders: (tab) => request(`/partner/orders${tab ? `?tab=${tab}` : ''}`),
  respondToOrder: (id, action, reason) => request(`/partner/orders/${id}/respond`, { method: 'POST', body: { action, reason } }),
  recordGarmentIntake: (id, intakeData) => request(`/partner/orders/${id}/intake`, { method: 'POST', body: intakeData }),
  requestPriceChange: (id, newSubtotal, reason) => request(`/partner/orders/${id}/request-price-change`, { method: 'POST', body: { newSubtotal, reason } }),
  updateOrderStatus: (id, status, notes) => request(`/partner/orders/${id}/status`, { method: 'POST', body: { status, notes } }),
  getPartnerProfile: () => request('/partner/profile'),
  updatePartnerProfile: (profile) => request('/partner/profile', { method: 'PUT', body: profile }),
  getPartnerServices: () => request('/partner/services'),
  createPartnerService: (service) => request('/partner/services', { method: 'POST', body: service }),
  updatePartnerService: (id, service) => request(`/partner/services/${id}`, { method: 'PUT', body: service }),
  deletePartnerService: (id) => request(`/partner/services/${id}`, { method: 'DELETE' }),
  getPartnerStats: () => request('/partner/stats'),

  // Admin Area
  getAdminStats: () => request('/admin/stats'),
  getAdminPartners: (status) => request(`/admin/partners${status ? `?status=${status}` : ''}`),
  approvePartner: (id) => request(`/admin/partners/${id}/approve`, { method: 'POST' }),
  rejectPartner: (id) => request(`/admin/partners/${id}/reject`, { method: 'POST' }),
  getAdminOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/orders${qs ? `?${qs}` : ''}`);
  },
  getCommissionReport: () => request('/admin/commissions'),
  getAdminDisputes: () => request('/admin/disputes'),
  resolveDispute: (id, data) => request(`/admin/disputes/${id}/resolve`, { method: 'POST', body: data }),
  getAdminUsers: () => request('/admin/users'),
};

export default api;
