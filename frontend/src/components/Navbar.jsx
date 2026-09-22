import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  UtensilsCrossed,
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  Clock,
  Store,
  Bike,
  ShieldCheck,
  Menu,
  X,
  Compass,
  CircleArrowRight,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'restaurant':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
            <Store className="w-3 h-3" /> Restaurant Partner
          </span>
        );
      case 'delivery':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
            <Bike className="w-3 h-3" /> Delivery Partner
          </span>
        );
      case 'support':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Support Agent
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <User className="w-3 h-3" /> Customer
          </span>
        );
    }
  };

  const navLinks = () => {
    if (role === 'restaurant') {
      return [
        { label: 'Kitchen Orders', to: '/restaurant/dashboard' },
        { label: 'Menu Items', to: '/restaurant/menu' },
        { label: 'Restaurant Settings', to: '/restaurant/settings' },
      ];
    }
    if (role === 'delivery') {
      return [
        { label: 'Delivery Dashboard', to: '/delivery/dashboard' },
      ];
    }
    if (role === 'support') {
      return [
        { label: 'Global Orders', to: '/support/dashboard' },
        { label: 'Explore Food', to: '/' },
      ];
    }
    
    return [
      { label: 'Welcome  To  My Restaurants', to: '/' },
      ...(isAuthenticated ? [{ label: 'My Orders', to: '/my-orders' }] : []),
    ];
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:gap-4">
          
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="md:text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                Foody<span className="text-orange-600">Go</span>
              </span>
             
            </div>
          </Link>

      
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks().map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

         
          <div className="flex items-center gap-1 sm:gap-3">
           
            {(!role || role === 'customer') && (
              <Link
                to="/cart"
                className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                title="View Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

         
            <NotificationDropdown />

            
            {isAuthenticated ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 leading-tight max-w-[110px] truncate">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {user?.role}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      <div className="mt-2">{getRoleBadge()}</div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      My Profile
                    </Link>

                    {role === 'customer' && (
                      <Link
                        to="/my-orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Clock className="w-4 h-4 text-slate-400" />
                        My Orders
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                    >
                        <CircleArrowRight className ="text-black" />
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                >
                 
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2  text-xs md:text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-md shadow-orange-500/20"
                >
                  Sign Up
                </Link>
              </div>
            )}

           
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1">
            {navLinks().map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
