import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Restaurant ID is required"],
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Item price is required"],
      min: 0,
    },
    category: {
      type: String,
      
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

menuItemSchema.index({ restaurantId: 1, category: 1 });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;
