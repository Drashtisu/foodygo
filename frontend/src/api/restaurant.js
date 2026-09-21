import api from './client';

export const getAllRestaurants = async () => {
  const response = await api.get('/restaurants');
  return response.data;
};

export const searchRestaurants = async ({ query, cuisine, city } = {}) => {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (cuisine) params.append('cuisine', cuisine);
  if (city) params.append('city', city);

  const response = await api.get(`/restaurants/search?${params.toString()}`);
  return response.data;
};

export const getRestaurantById = async (id) => {
  const response = await api.get(`/restaurants/${id}`);
  return response.data;
};

export const createRestaurant = async (data) => {
  const response = await api.post('/restaurants', data);
  return response.data;
};

export const updateRestaurant = async (id, data) => {
  const response = await api.put(`/restaurants/${id}`, data);
  return response.data;
};

// Menu APIs
export const getMenuByRestaurant = async (restaurantId) => {
  const response = await api.get(`/menu/restaurant/${restaurantId}`);
  return response.data;
};

export const addMenuItem = async (data) => {
  const response = await api.post('/menu', data);
  return response.data;
};

export const updateMenuItem = async (id, data) => {
  const response = await api.put(`/menu/${id}`, data);
  return response.data;
};

export const deleteMenuItem = async (id) => {
  const response = await api.delete(`/menu/${id}`);
  return response.data;
};

// Restaurant Kitchen Order Management
export const getIncomingOrders = async (status) => {
  const url = status ? `/restaurant-service/orders?status=${status}` : '/restaurant-service/orders';
  const response = await api.get(url);
  return response.data;
};

export const acceptOrder = async (orderId) => {
  const response = await api.put(`/restaurant-service/order/${orderId}/accept`);
  return response.data;
};

export const rejectOrder = async (orderId, reason) => {
  const response = await api.put(`/restaurant-service/order/${orderId}/reject`, { reason });
  return response.data;
};

export const startPreparing = async (orderId) => {
  const response = await api.put(`/restaurant-service/order/${orderId}/preparing`);
  return response.data;
};

export const markFoodReady = async (orderId) => {
  const response = await api.put(`/restaurant-service/order/${orderId}/ready`);
  return response.data;
};
