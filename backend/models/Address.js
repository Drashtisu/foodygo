import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
   
    addressType: {
      type: String,
      enum: ["HOME", "WORK", "OTHER"],
      default: "HOME",
    }
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model("Address", addressSchema);
export default Address;
