import Review from "../../../models/Review.js";
import Order, { ORDER_STATUS } from "../../../models/Order.js";
import Restaurant from "../../../models/Restaurant.js";
import User from "../../../models/User.js";

export const submitReview = async (req, res, next) => {
  try {
    const {
      orderId,
      restaurantRating,
      restaurantReview,
      deliveryRating,
      deliveryReview,
    } = req.body;

    if (!orderId || !restaurantRating) {
      return res.status(400).json({
        success: false,
        message: "Please provide orderId and restaurantRating (1-5)",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to review this order",
      });
    }

    if (order.orderStatus === ORDER_STATUS.PENDING_PAYMENT) {
      return res.status(400).json({
        success: false,
        message: "Reviews can only be submitted for confirmed orders.",
      });
    }

    const existingReview = await Review.findOne({ orderId: order._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this order",
      });
    }

    const review = await Review.create({
      orderId: order._id,
      customerId: req.user._id,
      restaurantId: order.restaurantId,
      deliveryBoyId: order.deliveryBoyId,
      restaurantRating: Number(restaurantRating),
      restaurantReview: restaurantReview || "",
      deliveryRating: deliveryRating ? Number(deliveryRating) : 5,
      deliveryReview: deliveryReview || "",
    });

    const allRestaurantReviews = await Review.find({
      restaurantId: order.restaurantId,
    });
    const avgRating =
      allRestaurantReviews.reduce((sum, r) => sum + r.restaurantRating, 0) /
      allRestaurantReviews.length;

    await Restaurant.findByIdAndUpdate(order.restaurantId, {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews: allRestaurantReviews.length,
    });

    res.status(201).json({
      success: true,
      flowStep: "rating /views",
      message: "Thank you! Your rating and review have been submitted successfully.",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const review = await Review.findOne({ orderId })
      .populate("restaurantId", "name")
      .populate("customerId", "name");

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};



