import api from './client';

// Cart APIs
export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};

export const addToCart = async (menuItemId, quantity = 1) => {
  const response = await api.post('/cart/add', { menuItemId, quantity });
  return response.data;
};

export const updateCartItem = async (menuItemId, quantity) => {
  const response = await api.put('/cart/item', { menuItemId, quantity });
  return response.data;
};

export const removeFromCart = async (menuItemId) => {
  const response = await api.delete(`/cart/item/${menuItemId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await api.delete('/cart/clear');
  return response.data;
};

// Address APIs
export const getUserAddresses = async () => {
  const response = await api.get('/addresses');
  return response.data;
};

export const addAddress = async (addressData) => {
  const response = await api.post('/addresses', addressData);
  return response.data;
};

export const updateAddress = async (id, addressData) => {
  const response = await api.put(`/addresses/${id}`, addressData);
  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await api.delete(`/addresses/${id}`);
  return response.data;
};

// Orders APIs
export const getCustomerOrders = async () => {
  const response = await api.get('/orders/my-orders');
  return response.data;
};

export const getAllOrders = async (status) => {
  const url = status ? `/orders?status=${status}` : '/orders';
  const response = await api.get(url);
  return response.data;
};

export const getOrderDetails = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const trackOrder = async (id) => {
  const response = await api.get(`/orders/${id}/track`);
  return response.data;
};
