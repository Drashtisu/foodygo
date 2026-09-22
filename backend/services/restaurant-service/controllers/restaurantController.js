import Restaurant from "../../../models/Restaurant.js";
import User from "../../../models/User.js";
import MenuItem from "../../../models/MenuItem.js";

export const searchRestaurants = async (req, res, next) => {
  try {
    const { query, cuisine, city } = req.query;
    let filter = { isOpen: true };

  
    const restaurantsWithMenu = await MenuItem.distinct("restaurantId");
    filter._id = { $in: restaurantsWithMenu };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { cuisine: { $regex: query, $options: "i" } },
        { "address.city": { $regex: query, $options: "i" } },
      ];
    }

    if (cuisine) {
      filter.cuisine = { $regex: cuisine, $options: "i" };
    }

    if (city) {
      filter["address.city"] = { $regex: city, $options: "i" };
    }

    const restaurants = await Restaurant.find(filter).populate(
      "ownerId",
      "name email phone"
    );

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRestaurants = async (req, res, next) => {
  try {
    const { hasMenu } = req.query;
    let filter = {};

    if (hasMenu === "true") {
      const restaurantsWithMenu = await MenuItem.distinct("restaurantId");
      filter._id = { $in: restaurantsWithMenu };
    }

    const restaurants = await Restaurant.find(filter).populate(
      "ownerId",
      "name email phone"
    );
    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate(
      "ownerId",
      "name email phone"
    );
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

export const createRestaurant = async (req, res, next) => {
  try {
    const { name, description, cuisine, address, phone, imageUrl } = req.body;

    const existingRestaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: "You have already registered a restaurant",
      });
    }

    const restaurant = await Restaurant.create({
      ownerId: req.user._id,
      name,
      description,
      cuisine: Array.isArray(cuisine) ? cuisine : [cuisine],
      address,
      phone,
      imageUrl: imageUrl || "",
    });

    res.status(201).json({
      success: true,
      message: "Restaurant registered successfully",
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRestaurant = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (
      restaurant.ownerId.toString() !== req.user._id.toString() &&
      req.user.role !== "support"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this restaurant",
      });
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};
