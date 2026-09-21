import api from './client';

export const choosePaymentOption = async ({ paymentOption, addressId, deliveryAddress }) => {
  const response = await api.post('/payment/choose-option', {
    paymentOption,
    addressId,
    deliveryAddress,
  });
  return response.data;
};

export const processPayment = async ({ orderId, simulateOutcome = 'SUCCESS' }) => {
  const response = await api.post('/payment/process', {
    orderId,
    simulateOutcome,
  });
  return response.data;
};

export const retryPayment = async ({ orderId, newPaymentOption, simulateOutcome = 'SUCCESS' }) => {
  const response = await api.post('/payment/retry', {
    orderId,
    newPaymentOption,
    simulateOutcome,
  });
  return response.data;
};

export const getInvoice = async (orderId) => {
  const response = await api.get(`/payment/invoice/${orderId}`);
  return response.data;
};
