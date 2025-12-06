import { useEffect, useState } from "react";

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
    <div className="container-fluid" style={{ height: "100vh", overflow: "hidden" }}>
      <div className="row h-100">
        {/* Left side - Menu */}
        <div className="col-md-7 h-100 d-flex flex-column p-3 bg-light">
          <h2 className="mb-3">POS - Cashier</h2>

          {/* Category tabs */}
          <div className="mb-3">
            <div className="btn-group" role="group">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn ${
                    selectedCategory === cat
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu grid */}
          <div className="flex-grow-1 overflow-auto">
            <div className="row g-2">
              {filteredItems.map((item) => (
                <div key={item.id} className="col-6 col-lg-4">
                  <button
                    className={`btn w-100 h-100 d-flex flex-column align-items-center justify-content-center p-3 ${
                      currentItem?.id === item.id
                        ? "btn-success"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => selectItem(item)}
                    style={{ minHeight: "80px" }}
                  >
                    <div className="fw-bold">{item.name}</div>
                    <div className="text-muted small">
                      ${Number(item.price).toFixed(2)}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Item customization panel */}
          {currentItem && (
            <div className="mt-3 p-3 border rounded bg-white">
              <h5>{currentItem.name}</h5>
              
              <div className="mb-2">
                <label className="form-label fw-bold">Size:</label>
                <div className="btn-group ms-2" role="group">
                  <button
                    className={`btn btn-sm ${
                      currentSize === "Small" ? "btn-primary" : "btn-outline-primary"
                    }`}
                    onClick={() => setCurrentSize("Small")}
                  >
                    Small
                  </button>
                  <button
                    className={`btn btn-sm ${
                      currentSize === "Large" ? "btn-primary" : "btn-outline-primary"
                    }`}
                    onClick={() => setCurrentSize("Large")}
                  >
                    Large (+$1.00)
                  </button>
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label fw-bold">Toppings:</label>
                <div className="d-flex flex-wrap gap-1">
                  {availableToppings.map((topping) => (
                    <button
                      key={topping.id}
                      className={`btn btn-sm ${
                        currentToppings.find((t) => t.id === topping.id)
                          ? "btn-success"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => toggleTopping(topping)}
                    >
                      {topping.name} (+${Number(topping.price).toFixed(2)})
                    </button>
                  ))}
                </div>
              </div>
              {/*Add Sugar Level*/}
              <div className="mb-2">
                <label className="form-label fw-bold">Sugar Level:</label>
                <div className="btn-group w-100" role="group">
                  {["0%", "25%", "50%", "75%", "100%"].map((lvl) => (
                    <button
                      key={lvl}
                      className={`btn btn-sm ${
                        currentSugar === lvl ? "btn-primary" : "btn-outline-primary"
                      }`}
                      onClick={() => setCurrentSugar(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              {/*Add Ice Level*/}
              <div className="mb-2">
                <label className="form-label fw-bold">Ice Level:</label>
                <div className="btn-group w-100" role="group">
                  {["0%", "25%", "50%", "75%", "100%"].map((lvl) => (
                    <button
                      key={lvl}
                      className={`btn btn-sm ${
                        currentIce === lvl ? "btn-primary" : "btn-outline-primary"
                      }`}
                      onClick={() => setCurrentIce(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary w-100 mt-2"
                onClick={addToCart}
              >
                Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* Right side - Cart & Checkout */}
        <div className="col-md-5 h-100 d-flex flex-column p-3 bg-white border-start">
          <h4 className="mb-3">Current Order</h4>

          {/* Customer info */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Phone Number *"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="form-control mb-2"
            />
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="text"
                  placeholder="First Name"
                  value={customerFirst}
                  onChange={(e) => setCustomerFirst(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="col-6">
                <input
                  type="text"
                  placeholder="Last Name"
                  value={customerLast}
                  onChange={(e) => setCustomerLast(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-grow-1 overflow-auto border rounded p-2 mb-3">
            {cart.length === 0 ? (
              <p className="text-muted text-center mt-3">No items in cart</p>
            ) : (
              <div>
                {cart.map((item, i) => (
                  <div key={i} className="card mb-2">
                    <div className="card-body p-2">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="fw-bold">
                            {item.name} ({item.size})
                          </div>
                          {item.toppings.length > 0 && (
                            <div className="text-muted small">
                              {item.toppings.map((t) => t.name).join(", ")}
                            </div>
                          )}
                          <div className="text-muted small">
                            Sugar: {item.sugar} | Ice: {item.ice}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold">
                            $
                            {(
                              item.price +
                              item.toppings.reduce((s, t) => s + t.price, 0)
                            ).toFixed(2)}
                          </div>
                          <button
                            className="btn btn-sm btn-outline-danger mt-1"
                            onClick={() => removeFromCart(i)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment options */}
          <div className="mb-3">
            <label className="form-label fw-bold">Payment Method:</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Digital">Digital Wallet</option>
            </select>
          </div>

          {/* Tip */}
          <div className="mb-3">
            <label className="form-label fw-bold">Tip %:</label>
            <div className="input-group">
              <input
                type="number"
                value={tipPercent}
                onChange={(e) => setTipPercent(e.target.value)}
                className="form-control"
                min="0"
                max="100"
              />
              <span className="input-group-text">%</span>
            </div>
            <div className="btn-group w-100 mt-2" role="group">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setTipPercent(10)}
              >
                10%
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setTipPercent(15)}
              >
                15%
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setTipPercent(20)}
              >
                20%
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setTipPercent(0)}
              >
                No Tip
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="border-top pt-3 mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-1">
              <span>Tip ({tipPercent}%):</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold fs-5 border-top pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="d-grid gap-2">
            <button
              className="btn btn-success btn-lg"
              onClick={submitOrder}
              disabled={cart.length === 0 || !customerPhone}
            >
              Complete Order
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}