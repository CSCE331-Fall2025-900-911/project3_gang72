import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import About from "./pages/manager";
import Contact from "./pages/cashier";
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />         {/* Home page */}
          <Route path="/manager" element={<About />} />   {/* About page */}
          <Route path="/cashier" element={<Contact />} />{/* Contact page */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
