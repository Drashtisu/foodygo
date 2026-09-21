import api from './client';

export const getAvailableOrders = async () => {
  const response = await api.get('/delivery-service/available-orders');
  return response.data;
};

export const getMyDeliveries = async (activeOnly = false) => {
  const response = await api.get(`/delivery-service/my-deliveries${activeOnly ? '?activeOnly=true' : ''}`);
  return response.data;
};

export const assignDeliveryBoy = async (orderId, deliveryBoyId) => {
  const response = await api.put(`/delivery-service/order/${orderId}/assign`, { deliveryBoyId });
  return response.data;
};

export const acceptDelivery = async (orderId) => {
  const response = await api.put(`/delivery-service/order/${orderId}/accept`);
  return response.data;
};

export const declineDelivery = async (orderId, reason) => {
  const response = await api.put(`/delivery-service/order/${orderId}/decline`, { reason });
  return response.data;
};

export const goToRestaurant = async (orderId) => {
  const response = await api.put(`/delivery-service/order/${orderId}/go-to-restaurant`);
  return response.data;
};

export const takeFood = async (orderId) => {
  const response = await api.put(`/delivery-service/order/${orderId}/take-food`);
  return response.data;
};

export const foodOutForDelivery = async (orderId) => {
  const response = await api.put(`/delivery-service/order/${orderId}/out-for-delivery`);
  return response.data;
};

export const reachedCustomerLocation = async (orderId) => {
  const response = await api.put(`/delivery-service/order/${orderId}/reached-location`);
  return response.data;
};

export const reportDeliveryIssue = async (orderId, reason) => {
  const response = await api.put(`/delivery-service/order/${orderId}/not-reached`, { reason });
  return response.data;
};

export const handover = async (orderId) => {
  const response = await api.put(`/delivery-service/order/${orderId}/handover`);
  return response.data;
};

export const markOrderDelivered = async (orderId) => {
  const response = await api.put(`/delivery-service/order/${orderId}/deliver`);
  return response.data;
};
