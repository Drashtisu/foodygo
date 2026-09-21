import MenuItem from "../../../models/MenuItem.js";
import Restaurant from "../../../models/Restaurant.js";

export const getMenuByRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const menuItems = await MenuItem.find({
      restaurantId,
      isAvailable: true,
    }).sort({ category: 1 });

    const categorizedMenu = menuItems.reduce((acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      count: menuItems.length,
      categories: Object.keys(categorizedMenu),
      data: categorizedMenu,
      rawItems: menuItems,
    });
  } catch (error) {
    next(error);
  }
};

export const addMenuItem = async (req, res, next) => {
  try {
    const { restaurantId, name, description, price, category, imageUrl } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
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
        message: "Not authorized to add menu items to this restaurant",
      });
    }

    const menuItem = await MenuItem.create({
      restaurantId,
      name,
      description,
      price,
      category,
      imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      data: menuItem,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: menuItem,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    await menuItem.deleteOne();

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
