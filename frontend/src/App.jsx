import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/navbar";
import VoiceNavigationButton from "./components/voiceNavigationButton";
import HighContrastToggle from "./components/highContrastToggle";
import Home from "./pages/home";
import Manager from "./pages/manager";
import Employees from "./pages/employees";
import Ingredients from "./pages/ingredients";
import Sales from "./pages/sales";
import Cashier from "./pages/cashier";
import Kiosk from "./pages/kiosk";
import Menu from "./pages/menu";
import Items from "./pages/items";
import XReport from "./pages/xreport";
import ZReport from "./pages/zreport";
import Login from "./Login";
import './highContrast.css'
import './App.css'

// Protected Route component - requires @tamu.edu email
function ProtectedRoute({ children }) {
  const location = useLocation();
  const userStr = sessionStorage.getItem('user');

  if (!userStr) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  try {
    const user = JSON.parse(userStr);

    if (!user.email || !user.email.toLowerCase().endsWith('@tamu.edu')) {
      sessionStorage.removeItem('user');
      return <Navigate to="/login" state={{ from: location.pathname, error: 'Only @tamu.edu email addresses are authorized.' }} replace />;
    }
  } catch (e) {
    console.error('Failed to parse user data:', e);
    sessionStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <VoiceNavigationButton /> {/* ADD THIS - the button will show on all pages */}
      <HighContrastToggle />
      <Navbar />
      <div className="container-fluid mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/manager" element={<ProtectedRoute><Manager /></ProtectedRoute>}>
            <Route path="employees" element={<Employees />} />
            <Route path="ingredients" element={<Ingredients />} />
            <Route path="sales" element={<Sales />} />
            <Route path="items" element={<Items />} />
            <Route path="xreport" element={<XReport />} />
            <Route path="zreport" element={<ZReport />} />
          </Route>
          <Route path="/cashier" element={<ProtectedRoute><Cashier /></ProtectedRoute>} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/menu" element={<Menu />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;