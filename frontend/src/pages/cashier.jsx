import { useEffect, useState } from "react";
import "../Cashier.css";

export default function Cashier() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [tipPercent, setTipPercent] = useState(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerFirst, setCustomerFirst] = useState("");
  const [customerLast, setCustomerLast] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [availableToppings, setAvailableToppings] = useState([]);
  const [currentSugar, setCurrentSugar] = useState("100%");
  const [currentIce, setCurrentIce] = useState("100%");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [currentItem, setCurrentItem] = useState(null);
  const [currentSize, setCurrentSize] = useState("Small");
  const [currentToppings, setCurrentToppings] = useState([]);

  const formatPhone = (value = "") => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 3));
    if (digits.length > 3) parts.push(digits.slice(3, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 10));
    return { formatted: parts.join("-"), digits };
  };

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setMenuItems(data.items);
          setAvailableToppings(
            data.items.filter((i) => i.category?.toLowerCase().includes("topping"))
          );
        }
      })
      .catch(console.error);
  }, []);

  const drinksAndFood = menuItems.filter(
    (item) => !item.category?.toLowerCase().includes("topping")
  );

  const categories = ["All", ...new Set(drinksAndFood.map((i) => i.category || "Other"))];

  const filteredItems =
    selectedCategory === "All"
      ? drinksAndFood
      : drinksAndFood.filter((i) => i.category === selectedCategory);

  const selectItem = (item) => {
    setCurrentItem(item);
    setCurrentSize("Small");
    setCurrentToppings([]);
  };

  const toggleTopping = (topping) => {
    setCurrentToppings((prev) =>
      prev.find((t) => t.id === topping.id)
        ? prev.filter((t) => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  const addToCart = () => {
    if (!currentItem) return;

    const itemPrice =
      currentSize === "Large"
        ? Number(currentItem.price) + 1.0
        : Number(currentItem.price);

    const cartItem = {
      id: currentItem.id,
      name: currentItem.name,
      size: currentSize,
      price: itemPrice,
      toppings: currentToppings.map((t) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
      })),
      sugar: currentSugar,
      ice: currentIce,
    };

    setCart((prev) => [...prev, cartItem]);
    setCurrentItem(null);
    setCurrentSize("Small");
    setCurrentToppings([]);
    setCurrentSugar("100%");
    setCurrentIce("100%");
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setTipPercent(0);
  };

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + item.price + item.toppings.reduce((s, t) => s + t.price, 0),
    0
  );
  const tipAmount = subtotal * (Number(tipPercent) / 100);
  const total = subtotal + tipAmount;

  const submitOrder = async () => {
    const { digits: phoneDigits } = formatPhone(customerPhone);

    if (phoneDigits.length !== 10) {
      alert("Phone number must be 10 digits.");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const items = cart.flatMap((item) => [
      {
        itemId: item.id,
        name: `${item.name} (${item.size})`,
        price: item.price,
      },
      ...item.toppings.map((t) => ({
        itemId: t.id,
        name: t.name,
        price: t.price,
      })),
    ]);

    const payload = {
      customer: {
        firstName: customerFirst,
        lastName: customerLast,
        phone: phoneDigits,
      },
      tipPercent: Number(tipPercent) || 0,
      items,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        alert(`Order placed! Total: $${data.total.toFixed(2)}`);
        clearCart();
        setCustomerPhone("");
        setCustomerFirst("");
        setCustomerLast("");
      } else {
        alert("Order failed.");
      }
    } catch (err) {
      alert("Error placing order");
    }
  };

  return (
    <div className="main-content" style={{ width: "100%", minHeight: "100vh", display: "flex" }}>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT SIDE - MENU */}
        <div style={{ flex: "1 1 58%", padding: "24px", overflowY: "auto" }}>
          <h2>POS - Cashier</h2>

          {/* Category Tabs */}
          <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "10px 20px",
                  background: selectedCategory === cat ? "#583e23" : "#fff",
                  color: selectedCategory === cat ? "#fff" : "#333",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: "12px",
            }}
          >
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => selectItem(item)}
                style={{
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  background: currentItem?.id === item.id ? "#28a745" : "#fff",
                  color: currentItem?.id === item.id ? "#fff" : "#333",
                }}
              >
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div>${Number(item.price).toFixed(2)}</div>
              </button>
            ))}
          </div>

          {/* CUSTOMIZATION PANEL */}
          {currentItem && (
            <div style={{ marginTop: "20px", padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #ddd" }}>
              <h4>{currentItem.name}</h4>

              {/* Size */}
              <div style={{ marginBottom: "16px" }}>
                <label>Size:</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setCurrentSize("Small")}
                    className={currentSize === "Small" ? "active-btn" : ""}
                  >
                    Small
                  </button>
                  <button
                    onClick={() => setCurrentSize("Large")}
                    className={currentSize === "Large" ? "active-btn" : ""}
                  >
                    Large (+$1.00)
                  </button>
                </div>
              </div>

              {/* Toppings */}
              <div style={{ marginBottom: "16px" }}>
                <label>Toppings:</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {availableToppings.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleTopping(t)}
                      className={currentToppings.some((x) => x.id === t.id) ? "active-btn" : ""}
                    >
                      {t.name} (+${Number(t.price).toFixed(2)})
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar */}
              <div style={{ marginBottom: "16px" }}>
                <label>Sugar:</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["0%", "25%", "50%", "75%", "100%"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCurrentSugar(lvl)}
                      className={currentSugar === lvl ? "active-btn" : ""}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ice */}
              <div style={{ marginBottom: "16px" }}>
                <label>Ice:</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["0%", "25%", "50%", "75%", "100%"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCurrentIce(lvl)}
                      className={currentIce === lvl ? "active-btn" : ""}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <button className="add-btn" onClick={addToCart}>
                Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - CART */}
        <div style={{ flex: "1 1 42%", padding: "24px", borderLeft: "1px solid #ddd" }}>
          <h3>Current Order</h3>

          {/* Customer Info */}
          <input
            type="text"
            placeholder="Phone Number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="First Name"
              value={customerFirst}
              onChange={(e) => setCustomerFirst(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={customerLast}
              onChange={(e) => setCustomerLast(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          {/* Cart Items */}
          <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
            {cart.length === 0 ? (
              <p style={{ textAlign: "center", color: "#777" }}>No items in cart</p>
            ) : (
              cart.map((item, i) => (
                <div key={i} style={{ border: "1px solid #ddd", padding: "10px", borderRadius: "8px", marginBottom: "10px" }}>
                  <strong>
                    {item.name} ({item.size})
                  </strong>
                  <br />
                  {item.toppings.length > 0 && (
                    <small>Toppings: {item.toppings.map((t) => t.name).join(", ")}</small>
                  )}
                  <br />
                  <small>Sugar {item.sugar} | Ice {item.ice}</small>
                  <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
                    <strong>
                      $
                      {(item.price +
                        item.toppings.reduce((s, t) => s + t.price, 0)).toFixed(2)}
                    </strong>
                    <button onClick={() => removeFromCart(i)} style={{ color: "red" }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method */}
          <label>Payment Method:</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: "100%", marginBottom: "20px" }}
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Digital">Digital Wallet</option>
          </select>

          {/* Tip */}
          <label>Tip (%):</label>
          <input
            type="number"
            value={tipPercent}
            onChange={(e) => setTipPercent(e.target.value)}
            min="0"
            max="100"
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {[10, 15, 20, 0].map((v) => (
              <button key={v} onClick={() => setTipPercent(v)}>
                {v}%
              </button>
            ))}
          </div>

          {/* Summary */}
          <div style={{ marginBottom: "20px" }}>
            <div>Subtotal: ${subtotal.toFixed(2)}</div>
            <div>Tip: ${tipAmount.toFixed(2)}</div>
            <hr />
            <div style={{ fontWeight: "700" }}>Total: ${total.toFixed(2)}</div>
          </div>

          <button className="submit-btn" onClick={submitOrder} style={{ width: "100%", padding: "12px" }}>
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
}
