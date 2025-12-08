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

// Protected Route component
function ProtectedRoute({ children }) {
  const location = useLocation();
  const userStr = sessionStorage.getItem('user');

  if (!userStr) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  try {
    const user = JSON.parse(userStr);

    if (!user.email) {
      sessionStorage.removeItem('user');
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
  } catch (e) {
    console.error('Failed to parse user data:', e);
    sessionStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

// Wrapper to conditionally show navbar
function AppContent() {
  const location = useLocation();
  const isManagerPage = location.pathname.startsWith('/manager');

  return (
    <>
      <VoiceNavigationButton />
      <HighContrastToggle />
      
      {/* Show different layouts for manager vs regular pages */}
      {isManagerPage ? (
        // Manager pages - no regular navbar, no container wrapper
        <Routes>
          <Route path="/manager" element={<ProtectedRoute><Manager /></ProtectedRoute>}>
            <Route path="employees" element={<Employees />} />
            <Route path="ingredients" element={<Ingredients />} />
            <Route path="sales" element={<Sales />} />
            <Route path="items" element={<Items />} />
            <Route path="xreport" element={<XReport />} />
            <Route path="zreport" element={<ZReport />} />
          </Route>
        </Routes>
      ) : (
        // Regular pages - show navbar and container
        <>
          <Navbar />
          <div className="container-fluid mt-4">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cashier" element={<ProtectedRoute><Cashier /></ProtectedRoute>} />
              <Route path="/kiosk" element={<Kiosk />} />
              {/* Changed by Hiya */}
          {/* <Route path="/menu" element={<Menu />} /> */}
          <Route path="/menu" element={
            <div className="menu-page-wrapper">
              <Menu />
            </div>
          } />

            </Routes>
          </div>
        </>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;