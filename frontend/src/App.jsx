import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Manager from "./pages/manager";
import Employees from "./pages/employees";
import Ingredients from "./pages/ingredients";
import Sales from "./pages/sales";
import Cashier from "./pages/cashier";
import Kiosk from "./pages/kiosk";
import Menu from "./pages/menu";
import Items from "./pages/items";
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container-fluid mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manager" element={<Manager />}>
            {/* Nest child routes under /manager */}
            <Route path="employees" element={<Employees />} />
            <Route path="ingredients" element={<Ingredients />} />
            <Route path="sales" element={<Sales />} />
            <Route path = "items" element={<Items/>} />
          </Route>
          <Route path="/cashier" element={<Cashier />} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/menu" element={<Menu />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
