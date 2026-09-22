import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { choosePaymentOption, processPayment, retryPayment } from '../../api/payment';
import { useToast } from '../../context/ToastContext';
import {
  CreditCard,
  Smartphone,
  Building,
  Banknote,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Receipt,
  ArrowRight,
  Loader2,
  Lock,
} from 'lucide-react';

export const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const { showToast } = useToast();

  const addressId = location.state?.addressId;

  const [paymentOption, setPaymentOption] = useState('UPI');
  const [createdOrder, setCreatedOrder] = useState(null); // { orderId, orderNumber, breakdown }
  const [loadingOrderCreation, setLoadingOrderCreation] = useState(false);
  const [simulateOutcome, setSimulateOutcome] = useState('SUCCESS'); // 'SUCCESS' or 'FAILED'
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // success payload or failure payload

  const paymentMethods = [
    { id: 'UPI', label: 'UPI / QR', desc: 'Google Pay, PhonePe, Paytm', icon: Smartphone },
    { id: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, MasterCard, RuPay', icon: CreditCard },
    { id: 'NETBANKING', label: 'Net Banking', desc: 'All major Indian banks', icon: Building },
    { id: 'WALLET', label: 'FoodyGo Wallet', desc: 'Instant 1-click checkout', icon: Wallet },
    { id: 'COD', label: 'Cash on Delivery', desc: 'Pay cash or UPI at delivery', icon: Banknote },
  ];

  // Step 1: Choose option & generate order
  const handleInitiateOrder = async () => {
    try {
      setLoadingOrderCreation(true);
      const res = await choosePaymentOption({
        paymentOption,
        addressId,
      });

      if (res?.success) {
        setCreatedOrder({
          orderId: res.orderId,
          orderNumber: res.orderNumber,
          breakdown: res.breakdown,
        });
        showToast('Order generated! Please complete payment verification.', 'info');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to initialize payment', 'error');
    } finally {
      setLoadingOrderCreation(false);
    }
  };

  // Step 2: 2-way payment processing
  const handleExecutePayment = async () => {
    if (!createdOrder) return;
    try {
      setProcessingPayment(true);
      const res = await processPayment({
        orderId: createdOrder.orderId,
        simulateOutcome,
      });

      if (res?.success) {
        setPaymentResult({
          status: 'SUCCESS',
          order: res.order,
          invoice: res.invoice,
          payment: res.payment,
        });
        refreshCart(); // clear client cart
        showToast('Payment successful! Order confirmed.', 'success');
      }
    } catch (err) {
      const data = err.response?.data;
      setPaymentResult({
        status: 'FAILED',
        message: data?.message || 'Payment transaction was declined.',
        retryCount: data?.retryCount || 1,
      });
      showToast('Payment declined as simulated. You can retry with another method.', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Step 2b: Retry Payment
  const handleRetryPayment = async () => {
    if (!createdOrder) return;
    try {
      setProcessingPayment(true);
      const res = await retryPayment({
        orderId: createdOrder.orderId,
        newPaymentOption: paymentOption,
        simulateOutcome: 'SUCCESS', // Automatically succeed on retry
      });

      if (res?.success) {
        setPaymentResult({
          status: 'SUCCESS',
          order: res.order,
          invoice: res.invoice,
          payment: res.payment,
        });
        refreshCart();
        showToast('Payment retry successful! Order confirmed.', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Retry failed', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Payment & Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete your purchase securely via FoodyGo Payment Gateway
        </p>
      </div>

      {/* When payment succeeds */}
      {paymentResult?.status === 'SUCCESS' ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-100 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Order Confirmed & Paid
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-3">
              Thank You For Your Order!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Order #{paymentResult.order?.orderNumber} • Invoice #{paymentResult.invoice?.invoiceNumber}
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Paid:</span>
              <span className="font-bold text-slate-900">₹{paymentResult.invoice?.totalPaid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-bold text-slate-900">{paymentResult.payment?.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono text-slate-700">{paymentResult.payment?.transactionId}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/order/${createdOrder.orderId}/track`)}
              className="w-full cursor-pointer sm:w-auto px-6 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2"
            >
              <span>Order review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/my-orders"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4 text-slate-500" />
              <span>View All Orders</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Choose Payment Option */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900">
                1. Select Payment Method
              </h2>

              <div className="space-y-2.5">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentOption === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!!createdOrder}
                      onClick={() => setPaymentOption(m.id)}
                      className={`w-full cursor-pointer p-4 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      } ${createdOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{m.label}</p>
                          <p className="text-[11px] text-slate-400">{m.desc}</p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-orange-600 bg-orange-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!createdOrder && (
                <button
                  type="button"
                  disabled={loadingOrderCreation}
                  onClick={handleInitiateOrder}
                  className=" cursor-pointer w-full mt-4 py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2"
                >
                  {loadingOrderCreation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>Confirm Payment Option & Proceed</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: 2-Way Payment Processing Simulation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5">
              <h2 className="text-base font-black text-slate-900">
                2. Gateway Simulation
              </h2>

              {!createdOrder ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Lock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  Select a payment option on the left to activate verification.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200/60 text-xs space-y-1">
                    <p className="font-bold text-orange-950">
                      Order: #{createdOrder.orderNumber}
                    </p>
                    <p className="text-orange-700">
                      Amount Due: <span className="font-black text-sm">₹{createdOrder.breakdown?.totalAmount}</span>
                    </p>
                  </div>

                  {/* Simulation outcome radio */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Simulate Gateway Response:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSimulateOutcome('SUCCESS')}
                        className={`p-3 rounded-xl cursor-pointer border text-center font-bold transition ${
                          simulateOutcome === 'SUCCESS'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        Simulate SUCCESS
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulateOutcome('FAILED')}
                        className={`p-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                          simulateOutcome === 'FAILED'
                            ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        Simulate FAILED
                      </button>
                    </div>
                  </div>

                  {/* Payment Failed State with Retry */}
                  {paymentResult?.status === 'FAILED' && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Transaction Failed</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {paymentResult.message}
                      </p>
                      <button
                        type="button"
                        disabled={processingPayment}
                        onClick={handleRetryPayment}
                        className="w-full cursor-pointer mt-2 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
                      >
                        {processingPayment ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>Retry Payment Now (Will Succeed)</span>
                      </button>
                    </div>
                  )}

                  {paymentResult?.status !== 'FAILED' && (
                    <button
                      type="button"
                      disabled={processingPayment}
                      onClick={handleExecutePayment}
                      className={`w-full cursor-pointer py-3.5 px-4 font-bold rounded-2xl text-white shadow-xl transition flex items-center justify-center gap-2 ${
                        simulateOutcome === 'SUCCESS'
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                          : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      }`}
                    >
                      {processingPayment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>
                        Pay ₹{createdOrder.breakdown?.totalAmount} ({simulateOutcome})
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
