import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { getUserAddresses, addAddress } from '../../api/order';
import { useToast } from '../../context/ToastContext';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  MapPin,
  CheckCircle2,
  PlusCircle,
  Clock,
  ShieldCheck,
  Loader2,
  X,
} from 'lucide-react';

export const Cart = () => {
  const { cart, items, updateQuantity, removeItem, clear, cartTotal } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    landmark: '',
    isDefault: true,
  });
  const [submittingAddress, setSubmittingAddress] = useState(false);

  useEffect(() => {
    const fetchAddrs = async () => {
      try {
        setLoadingAddresses(true);
        const res = await getUserAddresses();
        if (res?.success) {
          const addrs = res.data || [];
          setAddresses(addrs);
          const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr._id);
        }
      } catch {
  
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddrs();
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAddress(true);
      const res = await addAddress(newAddress);
      if (res?.success) {
        showToast('Address added successfully!', 'success');
        setAddresses((prev) => [res.data, ...prev]);
        setSelectedAddressId(res.data._id);
        setShowAddressModal(false);
        setNewAddress({
          fullName: '',
          phone: '',
          street: '',
          city: '',
          state: '',
          postalCode: '',
          landmark: '',
          isDefault: false,
        });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add address', 'error');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const deliveryFee = 40;
  const tax = Math.round(cartTotal * 0.05);
  const grandTotal = cartTotal + deliveryFee + tax;

  const handleProceedToCheckout = () => {
    if (!selectedAddressId) {
      showToast('Please select or add a delivery address to proceed.', 'error');
      return;
    }
    navigate('/checkout', { state: { addressId: selectedAddressId } });
  };

  if (!items || items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-20 px-4 text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/10">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Your cart is empty
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Explore top restaurants near you and add your favorite dishes!
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition"
        >
          Explore Restaurants <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Review Your Order
          </h1>
         
        </div>

        <button
          onClick={clear}
          className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer" 
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
    
        <div className="lg:col-span-7 space-y-8">
        
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
              Cart Items ({items.length})
            </h2>

            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const itemId = item.menuItemId?._id || item.menuItemId;
                const itemImg =
                  item.menuItemId?.imageUrl ||
                  'https://images.unsplash.com/photo-154606990asasas1-ba9599a7e63c?w=200&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={itemId}
                    className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={itemImg}
                        alt={item.name}
                        className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs font-semibold text-orange-600 mt-0.5">
                          ₹{item.price} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                  
                      <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-2 py-1">
                        <button
                          onClick={() => {
                            if (item.quantity === 1) removeItem(itemId);
                            else updateQuantity(itemId, item.quantity - 1);
                          }}
                          className="p-1 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5 " />
                        </button>
                        <span className="text-xs font-black text-slate-900 w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(itemId, item.quantity + 1)}
                          className="p-1  hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 " />
                        </button>
                      </div>

                      <span className="text-sm font-black text-slate-900 w-16 text-right">
                        ₹{item.price * item.quantity}
                      </span>

                      <button
                        onClick={() => removeItem(itemId)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 cursor-pointer" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 cursor-pointer">
                <MapPin className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-black text-slate-900">
                  Select Delivery Address
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Add New
              </button>
            </div>

            {loadingAddresses ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 mb-3">No delivery addresses saved yet.</p>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-4 py-2 bg-orange-50 text-orange-600 font-bold text-xs rounded-xl hover:bg-orange-100 transition cursor-pointer"
                >
                  + Add Delivery Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className={`cursor-pointer p-4 rounded-2xl border text-left transition relative ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-orange-600 absolute top-3 right-3" />
                      )}
                      <p className="text-xs font-bold text-slate-900">{addr.fullName}</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      {addr.landmark && (
                        <p className="text-[10px] text-slate-400 mt-1">Landmark: {addr.landmark}</p>
                      )}
                      <p className="text-[11px] font-semibold text-slate-700 mt-1">
                        Phone: {addr.phone}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
              Bill Details
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Item Total</span>
                <span className="font-bold text-slate-900">₹{cartTotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span className="font-bold text-slate-900">₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes & Charges (5%)</span>
                <span className="font-bold text-slate-900">₹{tax}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-base font-black text-slate-900">
                <span>To Pay</span>
                <span className="text-xl text-orange-600">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="cursor-pointer w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/25 transition flex items-center justify-center gap-2 group"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure 2-Way Transaction Verification</span>
            </div>
          </div>
        </div>
      </div>

   
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add New Address</h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                 <input
  type="tel"
  required
  value={newAddress.phone}
  maxLength={10}
  inputMode="numeric"
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "");
    setNewAddress({ ...newAddress, phone: value });
  }}
  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
/>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  placeholder="Flat / House no, Building, Street"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  />
                </div>
                <div>
  <label className="block font-bold text-slate-700 mb-1">
    Postal Code
  </label>

  <input
    type="text"
    required
    value={newAddress.postalCode}
    inputMode="numeric"
    onChange={(e) =>
      setNewAddress({
        ...newAddress,
        postalCode: e.target.value.replace(/\D/g, ""),
      })
    }
    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
  />
</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  placeholder="Near central park"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAddress}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {submittingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
