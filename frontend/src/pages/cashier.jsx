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

  // Current item being customized
  const [currentItem, setCurrentItem] = useState(null);
  const [currentSize, setCurrentSize] = useState("Small");
  const [currentToppings, setCurrentToppings] = useState([]);

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setMenuItems(data.items);
          setAvailableToppings(
            data.items.filter((i) =>
              i.category?.toLowerCase().includes("topping")
            )
          );
        }
      })
      .catch(console.error);
  }, []);

  // Filter out toppings and group by category
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

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) =>
      sum + item.price + item.toppings.reduce((s, t) => s + t.price, 0),
    0
  );
  const tipAmount = subtotal * (Number(tipPercent) / 100);
  const total = subtotal + tipAmount;

  const submitOrder = async () => {
    if (!customerPhone) {
      alert("Customer phone is required!");
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
        phone: customerPhone,
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
        alert(`Order placed successfully!\nReceipt #${data.receiptId}\nTotal: $${data.total.toFixed(2)}`);
        // Clear form
        setCart([]);
        setTipPercent(0);
        setCustomerPhone("");
        setCustomerFirst("");
        setCustomerLast("");
        setPaymentMethod("Cash");
        setCurrentItem(null);
      } else {
        alert("Order failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error placing order");
    }
  };

  return (
    <div className="main-content">
      <div className="cashier-container">
        <div className="cashier-layout">
          {/* Left side - Menu */}
          <div className="menu-section">
            <div className="section-header">
              <h2 className="page-title">🧋 Point of Sale</h2>
            </div>

            {/* Category tabs */}
            <div className="category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-tab ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu grid */}
            <div className="menu-grid">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={`menu-item ${currentItem?.id === item.id ? "selected" : ""}`}
                  onClick={() => selectItem(item)}
                >
                  <div className="menu-item-name">{item.name}</div>
                  <div className="menu-item-price">
                    ${Number(item.price).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>

            {/* Item customization panel */}
            {currentItem && (
              <div className="customization-panel">
                <h5 className="customize-title">{currentItem.name}</h5>

                <div className="customize-section">
                  <label className="customize-label">Size:</label>
                  <div className="button-group">
                    <button
                      className={`option-btn ${currentSize === "Small" ? "active" : ""}`}
                      onClick={() => setCurrentSize("Small")}
                    >
                      Small
                    </button>
                    <button
                      className={`option-btn ${currentSize === "Large" ? "active" : ""}`}
                      onClick={() => setCurrentSize("Large")}
                    >
                      Large (+$1.00)
                    </button>
                  </div>
                </div>

                <div className="customize-section">
                  <label className="customize-label">Toppings:</label>
                  <div className="toppings-grid">
                    {availableToppings.map((topping) => (
                      <button
                        key={topping.id}
                        className={`topping-btn ${currentToppings.find((t) => t.id === topping.id) ? "active" : ""
                          }`}
                        onClick={() => toggleTopping(topping)}
                      >
                        {topping.name} (+${Number(topping.price).toFixed(2)})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="customize-section">
                  <label className="customize-label">Sugar Level:</label>
                  <div className="button-group">
                    {["0%", "25%", "50%", "75%", "100%"].map((lvl) => (
                      <button
                        key={lvl}
                        className={`option-btn small ${currentSugar === lvl ? "active" : ""}`}
                        onClick={() => setCurrentSugar(lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="customize-section">
                  <label className="customize-label">Ice Level:</label>
                  <div className="button-group">
                    {["0%", "25%", "50%", "75%", "100%"].map((lvl) => (
                      <button
                        key={lvl}
                        className={`option-btn small ${currentIce === lvl ? "active" : ""}`}
                        onClick={() => setCurrentIce(lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="add-to-cart-btn" onClick={addToCart}>
                  Add to Cart
                </button>
              </div>
            )}
          </div>

          {/* Right side - Cart & Checkout */}
          <div className="cart-section">
            <h4 className="cart-title">Current Order</h4>

            {/* Customer info */}
            <div className="customer-info">
              <input
                type="text"
                placeholder="Phone Number *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="input-field"
              />
              <div className="input-row">
                <input
                  type="text"
                  placeholder="First Name"
                  value={customerFirst}
                  onChange={(e) => setCustomerFirst(e.target.value)}
                  className="input-field half"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={customerLast}
                  onChange={(e) => setCustomerLast(e.target.value)}
                  className="input-field half"
                />
              </div>
            </div>

            {/* Cart items */}
            <div className="cart-items">
              {cart.length === 0 ? (
                <p className="empty-cart">No items in cart</p>
              ) : (
                <div>
                  {cart.map((item, i) => (
                    <div key={i} className="cart-item">
                      <div className="cart-item-content">
                        <div className="cart-item-details">
                          <div className="cart-item-name">
                            {item.name} ({item.size})
                          </div>
                          {item.toppings.length > 0 && (
                            <div className="cart-item-toppings">
                              {item.toppings.map((t) => t.name).join(", ")}
                            </div>
                          )}
                          <div className="cart-item-options">
                            Sugar: {item.sugar} | Ice: {item.ice}
                          </div>
                        </div>
                        <div className="cart-item-actions">
                          <div className="cart-item-price">
                            $
                            {(
                              item.price +
                              item.toppings.reduce((s, t) => s + t.price, 0)
                            ).toFixed(2)}
                          </div>
                          <button
                            className="remove-btn"
                            onClick={() => removeFromCart(i)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment options */}
            <div className="payment-section">
              <label className="section-label">Payment Method:</label>
              <select
                className="select-field"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Digital">Digital Wallet</option>
              </select>
            </div>

            {/* Tip */}
            <div className="tip-section">
              <label className="section-label">Tip %:</label>
              <div className="tip-input-group">
                <input
                  type="number"
                  value={tipPercent}
                  onChange={(e) => setTipPercent(e.target.value)}
                  className="input-field tip-input"
                  min="0"
                  max="100"
                />
                <span className="tip-suffix">%</span>
              </div>
              <div className="tip-buttons">
                <button className="tip-btn" onClick={() => setTipPercent(10)}>
                  10%
                </button>
                <button className="tip-btn" onClick={() => setTipPercent(15)}>
                  15%
                </button>
                <button className="tip-btn" onClick={() => setTipPercent(20)}>
                  20%
                </button>
                <button className="tip-btn" onClick={() => setTipPercent(0)}>
                  No Tip
                </button>
              </div>
            </div>

            {/* Totals */}
            <div className="totals-section">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Tip ({tipPercent}%):</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="action-buttons">
              <button
                className="complete-order-btn"
                onClick={submitOrder}
                disabled={cart.length === 0 || !customerPhone}
              >
                Complete Order
              </button>
              <button
                className="clear-cart-btn"
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}