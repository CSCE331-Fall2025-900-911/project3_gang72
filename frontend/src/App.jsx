import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Manager from "./pages/manager";
import Cashier from "./pages/cashier";
import Kiosk from "./pages/kiosk";
import Menu from "./pages/menu";
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container-fluid mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manager" element={<Manager />} />
          <Route path="/cashier" element={<Cashier />} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/menu" element={<Menu />} />
        </Routes>
      </div>

    </BrowserRouter>
  );
}

export default App;
