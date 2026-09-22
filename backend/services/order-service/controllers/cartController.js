import Cart from "../../../models/Cart.js";
import MenuItem from "../../../models/MenuItem.js";
import Restaurant from "../../../models/Restaurant.js";

export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ customerId: req.user._id })
      .populate("restaurantId", "name address phone")
      .populate("items.menuItemId", "name price category imageUrl");

    if (!cart) {
      cart = await Cart.create({
        customerId: req.user._id,
        items: [],
        totalAmount: 0,
      });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { menuItemId, quantity = 1 } = req.body;

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    if (!menuItem.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Item is currently unavailable",
      });
    }

    let cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      cart = new Cart({
        customerId: req.user._id,
        restaurantId: menuItem.restaurantId,
        items: [],
      });
    }

    if (
      cart.restaurantId &&
      cart.items.length > 0 &&
      cart.restaurantId.toString() !== menuItem.restaurantId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Your cart already contains items from a different restaurant. Please clear your cart first.",
      });
    }

    cart.restaurantId = menuItem.restaurantId;

    const existingItemIndex = cart.items.findIndex(
      (item) => item.menuItemId.toString() === menuItemId
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += Number(quantity);
      if (!cart.items[existingItemIndex].imageUrl && menuItem.imageUrl) {
        cart.items[existingItemIndex].imageUrl = menuItem.imageUrl;
      }
    } else {
      cart.items.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: Number(quantity),
        price: menuItem.price,
        imageUrl: menuItem.imageUrl || "",
      });
    }

    cart.calculateTotal();
    await cart.save();

    await cart.populate("restaurantId", "name address phone");
    await cart.populate("items.menuItemId", "name price category imageUrl");

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { menuItemId, quantity } = req.body;

    const cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.menuItemId.toString() === menuItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    if (cart.items.length === 0) {
      cart.restaurantId = null;
    }

    cart.calculateTotal();
    await cart.save();

    await cart.populate("restaurantId", "name address phone");
    await cart.populate("items.menuItemId", "name price category imageUrl");

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;

    const cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.menuItemId.toString() !== menuItemId
    );

    if (cart.items.length === 0) {
      cart.restaurantId = null;
    }

    cart.calculateTotal();
    await cart.save();

    await cart.populate("restaurantId", "name address phone");
    await cart.populate("items.menuItemId", "name price category imageUrl");

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ customerId: req.user._id });
    if (cart) {
      cart.items = [];
      cart.restaurantId = null;
      cart.totalAmount = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};
