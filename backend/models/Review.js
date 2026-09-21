import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    deliveryBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    restaurantRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    restaurantReview: {
      type: String,
      default: "",
    },
    deliveryRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    deliveryReview: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
