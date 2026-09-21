import Order, { ORDER_STATUS } from "../../../models/Order.js";
import Cart from "../../../models/Cart.js";
import Address from "../../../models/Address.js";
import Payment from "../../../models/Payment.js";
import Invoice from "../../../models/Invoice.js";
import Notification from "../../../models/Notification.js";
import Restaurant from "../../../models/Restaurant.js";
import { publishPaymentEvent } from "../kafka/producer.js";
import { KAFKA_EVENTS } from "../../../shared/constants/topics.js";

const generateOrderNumber = () =>
  `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
const generateInvoiceNumber = () =>
  `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
const generateTxnId = () =>
  `TXN-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

export const choosePaymentOption = async (req, res, next) => {
  try {
    const { paymentOption, addressId } = req.body;

    const validOptions = ["UPI", "CARD", "NETBANKING", "COD", "WALLET"];
    if (!paymentOption || !validOptions.includes(paymentOption.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment option. Choose from: ${validOptions.join(", ")}`,
      });
    }

    let address = null;
    if (addressId) {
      address = await Address.findById(addressId);
      if (!address || address.customerId.toString() !== req.user._id.toString()) {
        return res.status(404).json({
          success: false,
          message: "Selected delivery address not found",
        });
      }
    } else if (req.body.deliveryAddress) {
      address = req.body.deliveryAddress;
    } else {
      address =
        (await Address.findOne({ customerId: req.user._id, isDefault: true })) ||
        (await Address.findOne({ customerId: req.user._id }).sort({ createdAt: -1 }));
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Please select or add a delivery address before choosing payment option",
      });
    }

    const cart = await Cart.findOne({ customerId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Add items to cart before proceeding.",
      });
    }

    const subtotal = cart.calculateTotal();
    const deliveryFee = 40;
    const tax = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + deliveryFee + tax;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customerId: req.user._id,
      restaurantId: cart.restaurantId,
      items: cart.items,
      deliveryAddress: {
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        
      },
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      paymentOption: paymentOption.toUpperCase(),
      paymentStatus: "PENDING",
      orderStatus: ORDER_STATUS.PENDING_PAYMENT,
      statusHistory: [
        {
          status: ORDER_STATUS.PENDING_PAYMENT,
          timestamp: new Date(),
          note: `Payment option selected: ${paymentOption.toUpperCase()}`,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Payment option chosen. Proceed to 2-way payment processing.",
      orderId: order._id,
      orderNumber: order.orderNumber,
      breakdown: {
        subtotal,
        deliveryFee,
        tax,
        totalAmount,
      },
      paymentOption: order.paymentOption
    });
  } catch (error) {
    next(error);
  }
};

export const processPayment = async (req, res, next) => {
  try {
    const { orderId, simulateOutcome = "SUCCESS" } = req.body;

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
        message: "Not authorized for this order",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.PENDING_PAYMENT) {
      return res.status(400).json({
        success: false,
        message: `Order is already in '${order.orderStatus}' state`,
      });
    }

    const transactionId = generateTxnId();

    if (simulateOutcome.toUpperCase() === "FAILED" || simulateOutcome === false) {
      let payment = await Payment.findOne({ orderId: order._id });
      if (payment) {
        payment.paymentStatus = "FAILED";
        payment.failureReason = "Bank transaction declined / Insufficient funds";
        payment.retryCount += 1;
        await payment.save();
      } else {
        payment = await Payment.create({
          orderId: order._id,
          customerId: req.user._id,
          amount: order.totalAmount,
          paymentMethod: order.paymentOption,
          paymentStatus: "FAILED",
          transactionId,
          retryCount: 0,
          failureReason: "Bank transaction declined / Insufficient funds",
        });
      }

      order.paymentStatus = "FAILED";
      order.statusHistory.push({
        status: ORDER_STATUS.PENDING_PAYMENT,
        timestamp: new Date(),
        note: `Payment attempt failed (${payment.failureReason}). Waiting for retry.`,
      });
      await order.save();

      // Publish Kafka failure event
      await publishPaymentEvent(KAFKA_EVENTS.PAYMENT_FAILED, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        transactionId,
        failureReason: payment.failureReason,
      });

      return res.status(400).json({
        success: false,
        flowStep: "failure",
        message: "Payment failed. Please retry payment to confirm your order.",
        paymentId: payment._id,
        transactionId,
        orderId: order._id,
        retryCount: payment.retryCount,
       
      });
    }

    let payment = await Payment.findOne({ orderId: order._id });
    if (payment) {
      payment.paymentStatus = "SUCCESS";
      payment.transactionId = transactionId;
      payment.failureReason = null;
      await payment.save();
    } else {
      payment = await Payment.create({
        orderId: order._id,
        customerId: req.user._id,
        amount: order.totalAmount,
        paymentMethod: order.paymentOption,
        paymentStatus: "SUCCESS",
        transactionId,
      });
    }

    const invoiceNumber = generateInvoiceNumber();
    const invoice = await Invoice.create({
      invoiceNumber,
      orderId: order._id,
      paymentId: payment._id,
      customerId: req.user._id,
      restaurantId: order.restaurantId,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        total: i.quantity * i.price,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      tax: order.tax,
      totalPaid: order.totalAmount,
      paymentMethod: order.paymentOption,
      transactionId,
    });

    order.paymentStatus = "PAID";
    order.updateStatus(
      ORDER_STATUS.CONFIRMED,
      `Payment successful (Txn: ${transactionId}). Order confirmed.`
    );
    await order.save();

    await Notification.create({
      recipientId: req.user._id,
      recipientRole: "customer",
      orderId: order._id,
      title: "Order Confirmed!",
      message: `Your order #${order.orderNumber} is confirmed! Payment invoice #${invoice.invoiceNumber} has been generated.`,
      type: "ORDER_CONFIRMED",
    });

    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant) {
      await Notification.create({
        recipientId: restaurant.ownerId,
        recipientRole: "restaurant",
        orderId: order._id,
        title: "New Incoming Order!",
        message: `Order #${order.orderNumber} has been placed and confirmed. Please accept to start preparing.`,
        type: "ORDER_CONFIRMED",
      });
    }

    await Cart.findOneAndUpdate(
      { customerId: req.user._id },
      { items: [], restaurantId: null, totalAmount: 0 }
    );

  
    await publishPaymentEvent(KAFKA_EVENTS.PAYMENT_SUCCESS, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
      amount: order.totalAmount,
      invoiceNumber: invoice.invoiceNumber,
      transactionId,
    });

    res.status(200).json({
      success: true,
      flowStep: "payment success -> payment invoice -> order confirmed",
      message: "Payment successful! Invoice generated and order confirmed.",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      },
      payment: {
        paymentId: payment._id,
        transactionId,
        method: payment.paymentMethod,
        amount: payment.amount,
      },
      invoice: {
        invoiceNumber: invoice.invoiceNumber,
        issuedAt: invoice.issuedAt,
        totalPaid: invoice.totalPaid,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const retryPayment = async (req, res, next) => {
  try {
    const { orderId, newPaymentOption, simulateOutcome = "SUCCESS" } = req.body;

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
        message: "Not authorized for this order",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.PENDING_PAYMENT) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be retried. Current status: ${order.orderStatus}`,
      });
    }

    if (newPaymentOption) {
      order.paymentOption = newPaymentOption.toUpperCase();
      await order.save();
    }

    req.body.orderId = orderId;
    req.body.simulateOutcome = simulateOutcome;
    return processPayment(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    let query = {};

    if (orderId.startsWith("INV-")) {
      query.invoiceNumber = orderId;
    } else {
      query.$or = [{ orderId }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }];
    }

    const invoice = await Invoice.findOne(query)
      .populate("orderId")
      .populate("restaurantId", "name address phone")
      .populate("customerId", "name email phone");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found for this order or identifier",
      });
    }

    const userId = req.user._id.toString();
    const isCustomer = invoice.customerId?._id?.toString() === userId;
    const isSupport = req.user.role === "support";
    const isRestaurantOwner =
      req.user.role === "restaurant" &&
      invoice.restaurantId &&
      invoice.restaurantId._id?.toString() === userId;

    if (!isCustomer && !isSupport && !isRestaurantOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this invoice",
      });
    }

    res.status(200).json({
      success: true,
      flowStep: "payment invoice",
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};
