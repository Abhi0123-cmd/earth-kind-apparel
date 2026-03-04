import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Policies from "./pages/Policies";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import AboutUs from "./pages/AboutUs";
import Help from "./pages/Help";
import CustomerService from "./pages/CustomerService";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminReturns from "./pages/admin/AdminReturns";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminQueries from "./pages/admin/AdminQueries";
import AdminReplacements from "./pages/admin/AdminReplacements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <CartDrawer />
            <main>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/help" element={<Help />} />
                <Route path="/customer-service" element={<CustomerService />} />
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
                <Route path="/admin/inventory" element={<AdminInventory />} />
                <Route path="/admin/returns" element={<AdminReturns />} />
                <Route path="/admin/refunds" element={<AdminRefunds />} />
                <Route path="/admin/queries" element={<AdminQueries />} />
                <Route path="/admin/replacements" element={<AdminReplacements />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/integrations" element={<AdminIntegrations />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
