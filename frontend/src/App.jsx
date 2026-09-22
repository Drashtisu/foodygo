import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// import DemoAccountBar from './components/DemoAccountBar';
import Navbar from './components/Navbar';
// import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/customer/Home';
import RestaurantDetail from './pages/customer/RestaurantDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderTracking from './pages/customer/OrderTracking';
import MyOrders from './pages/customer/MyOrders';

import RestaurantDashboard from './pages/restaurant/RestaurantDashboard';
import MenuManagement from './pages/restaurant/MenuManagement';
import RestaurantSettings from './pages/restaurant/RestaurantSettings';

import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import SupportDashboard from './pages/support/SupportDashboard';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <CartProvider>
            <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
            
            
              <Navbar />

             
              <main className="flex-1">
                <Routes>
                
                  <Route path="/" element={<Home />} />
                  <Route path="/restaurant/:id" element={<RestaurantDetail />} />

                  
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <Cart />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order/:id/track"
                    element={
                      <ProtectedRoute>
                        <OrderTracking />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-orders"
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <MyOrders />
                      </ProtectedRoute>
                    }
                  />

                
                  <Route
                    path="/restaurant/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['restaurant', 'support']}>
                        <RestaurantDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/restaurant/menu"
                    element={
                      <ProtectedRoute allowedRoles={['restaurant', 'support']}>
                        <MenuManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/restaurant/settings"
                    element={
                      <ProtectedRoute allowedRoles={['restaurant', 'support']}>
                        <RestaurantSettings />
                      </ProtectedRoute>
                    }
                  />

               
                  <Route
                    path="/delivery/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['delivery', 'support']}>
                        <DeliveryDashboard />
                      </ProtectedRoute>
                    }
                  />

                
                  <Route
                    path="/support/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['support']}>
                        <SupportDashboard />
                      </ProtectedRoute>
                    }
                  />

                 
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

           
             
            </div>
          </CartProvider>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
