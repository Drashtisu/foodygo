import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderDetails } from '../../api/order';
import { getInvoice } from '../../api/payment';
import { submitReview, getReviewByOrder } from '../../api/review';
import { StarRating } from '../../components/StarRating';
import { useToast } from '../../context/ToastContext';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Bike,
  Store,
  FileText,
  RefreshCw,
  Star,
  Loader2,
  X,
  Send,
} from 'lucide-react';

export const OrderTracking = () => {
  const { id } = useParams();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Review states
  const [restRating, setRestRating] = useState(5);
  const [restReview, setRestReview] = useState('');
  const [delRating, setDelRating] = useState(5);
  const [delReview, setDelReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  // Invoice modal
  const [invoice, setInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const fetchTracking = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      const [detailsRes, reviewRes] = await Promise.all([
        getOrderDetails(id).catch(() => null),
        getReviewByOrder(id).catch(() => null),
      ]);

      if (detailsRes?.success) {
        setOrder(detailsRes.data);
      }
      if (reviewRes?.success && reviewRes.data) {
        setExistingReview(reviewRes.data);
        setReviewDone(true);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(() => fetchTracking(false), 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleOpenInvoice = async () => {
    try {
      setLoadingInvoice(true);
      setShowInvoiceModal(true);
      const res = await getInvoice(id);
      if (res?.success) {
        setInvoice(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Invoice not found yet', 'error');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      const res = await submitReview({
        orderId: id,
        restaurantRating: restRating,
        restaurantReview: restReview,
        deliveryRating: delRating,
        deliveryReview: delReview,
      });
      if (res?.success) {
        showToast('Review submitted successfully! Thank you.', 'success');
        setExistingReview(res.data);
        setReviewDone(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Connecting to Kafka Event Stream...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center border border-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <Link to="/" className="mt-4 inline-block px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold">
          Go Home
        </Link>
      </div>
    );
  }

  const isDelivered = order.orderStatus === 'DELIVERED';
  const isCancelled = order.orderStatus === 'CANCELLED' || order.orderStatus === 'DELIVERY_ISSUE';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      {/* Header status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
           Order review
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTracking(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition flex items-center gap-1.5 text-xs font-bold"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenInvoice}
            className="px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition flex items-center gap-1.5 text-xs font-bold"
          >
            <FileText className="w-4 h-4" />
            <span>Digital Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customer Review & Rating */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span>Customer Review & Rating</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Share your feedback on the restaurant food and delivery partner
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isDelivered
                  ? 'bg-emerald-100 text-emerald-800'
                  : isCancelled
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {order.orderStatus.replace(/_/g, ' ')}
            </span>
          </div>

          {reviewDone || existingReview ? (
            <div className="p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Your Review Has Been Submitted!</span>
              </div>
              <p className="text-xs text-slate-600">
                Thank you for your valuable feedback. It helps the restaurant and delivery partner improve their service.
              </p>

              <div className="space-y-3 pt-3 border-t border-emerald-200/60 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Restaurant & Food Quality:</span>
                    <StarRating rating={existingReview?.restaurantRating || restRating} size="sm" />
                  </div>
                  {(existingReview?.restaurantReview || restReview) && (
                    <p className="text-slate-600 mt-1.5 italic">
                      "{existingReview?.restaurantReview || restReview}"
                    </p>
                  )}
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Delivery Partner:</span>
                    <StarRating rating={existingReview?.deliveryRating || delRating} size="sm" />
                  </div>
                  {(existingReview?.deliveryReview || delReview) && (
                    <p className="text-slate-600 mt-1.5 italic">
                      "{existingReview?.deliveryReview || delReview}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-5 text-xs">
              {/* Restaurant Rating */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-800 text-sm">
                      Restaurant & Food Quality
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Rate taste, portion size, and presentation (1-5 stars)
                    </p>
                  </div>
                  <div className="py-1">
                    <StarRating
                      rating={restRating}
                      interactive={true}
                      onChange={setRestRating}
                      size="lg"
                    />
                  </div>
                </div>
                <textarea
                  placeholder="How was the taste, packaging, and food quality?"
                  value={restReview}
                  onChange={(e) => setRestReview(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  rows={3}
                />
              </div>

              {/* Delivery Rating */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-slate-800 text-sm">
                      Delivery Partner Service
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Rate delivery speed, rider attitude, and packaging (1-5 stars)
                    </p>
                  </div>
                  <div className="py-1">
                    <StarRating
                      rating={delRating}
                      interactive={true}
                      onChange={setDelRating}
                      size="lg"
                    />
                  </div>
                </div>
                <textarea
                  placeholder="Was the delivery rider fast, polite, and careful with your food?"
                  value={delReview}
                  onChange={(e) => setDelReview(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  rows={2}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3.5 px-5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2"
                >
                  {submittingReview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Submit Customer Review</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Driver & Restaurant details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Driver Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Bike className="w-4 h-4 text-orange-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Delivery Partner
              </h3>
            </div>

            {order.deliveryBoyId ? (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base">
                  {order.deliveryBoyId.name?.charAt(0) || 'D'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {order.deliveryBoyId.name}
                  </p>
                  <p className="text-xs text-slate-500">Phone: {order.deliveryBoyId.phone}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  Assigned
                </span>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                <Clock className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                Delivery partner will be assigned once kitchen marks food ready.
              </div>
            )}
          </div>

          {/* Restaurant Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Store className="w-4 h-4 text-orange-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Restaurant Info
              </h3>
            </div>

            <div className="space-y-1.5 pt-1">
              <p className="text-sm font-bold text-slate-900">
                {order.restaurantId?.name || 'Restaurant'}
              </p>
              <p className="text-xs text-slate-500">
                {order.restaurantId?.address?.street}, {order.restaurantId?.address?.city}
              </p>
              <p className="text-xs text-slate-500">Phone: {order.restaurantId?.phone}</p>
            </div>
          </div>

          {/* Items Summary */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Order Items ({order.items?.length || 0})
              </h3>
              <span className="font-bold text-xs text-orange-600">
                Total: ₹{order.totalAmount}
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between">
                  <span className="text-slate-700">
                    <span className="font-bold text-slate-900">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* Digital Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-bold text-slate-900">Tax Invoice</h3>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingInvoice || !invoice ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Retrieving digital invoice...</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                <div className="flex justify-between pb-3 border-b border-dashed border-slate-200">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">FoodyGo Deliveries</p>
                    <p className="text-slate-400">Invoice: #{invoice.invoiceNumber}</p>
                    <p className="text-slate-400">Date: {new Date(invoice.issuedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{invoice.restaurantId?.name}</p>
                    <p className="text-slate-400">{invoice.paymentMethod} Payment</p>
                    <p className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                      {invoice.transactionId}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-slate-700">Items Ordered:</p>
                  <div className="divide-y divide-slate-100">
                    {invoice.items?.map((item, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-semibold">₹{item.total}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>₹{invoice.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Fee:</span>
                    <span>₹{invoice.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tax:</span>
                    <span>₹{invoice.tax}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                    <span>Total Paid:</span>
                    <span className="text-orange-600">₹{invoice.totalPaid}</span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
                  >
                    Print Invoice
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
