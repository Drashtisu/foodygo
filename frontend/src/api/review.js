import api from './client';

export const submitReview = async ({
  orderId,
  restaurantRating,
  restaurantReview,
  deliveryRating,
  deliveryReview,
}) => {
  const response = await api.post('/reviews', {
    orderId,
    restaurantRating,
    restaurantReview,
    deliveryRating,
    deliveryReview,
  });
  return response.data;
};

export const getReviewByOrder = async (orderId) => {
  const response = await api.get(`/reviews/order/${orderId}`);
  return response.data;
};

export const getRestaurantReviews = async (restaurantId) => {
  const response = await api.get(`/reviews/restaurant/${restaurantId}`);
  return response.data;
};
