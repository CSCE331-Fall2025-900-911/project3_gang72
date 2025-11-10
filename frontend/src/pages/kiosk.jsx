
import { useEffect, useState } from "react";

export default function Kiosk() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [tipPercent, setTipPercent] = useState(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerFirst, setCustomerFirst] = useState("");
  const [customerLast, setCustomerLast] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Modal-related
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState("Small");
  const [availableToppings, setAvailableToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);

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

  // Filter out toppings from display
  const groupedItems = menuItems
    .filter((item) => !item.category?.toLowerCase().includes("topping"))
    .reduce((acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

  const openItemModal = (item) => {
    if (item.category?.toLowerCase().includes("topping")) return;
    setSelectedItem(item);
    setSelectedSize("Small");
    setSelectedToppings([]);
    const modal = new bootstrap.Modal(document.getElementById("itemModal"));
    modal.show();
  };

  const toggleTopping = (t) => {
    setSelectedToppings((prev) =>
      prev.find((s) => s.id === t.id)
        ? prev.filter((s) => s.id !== t.id)
        : [...prev, t]
    );
  };

  const addToCart = () => {
    if (!selectedItem) return;

    // Large is +$1.00 instead of +50%
    const itemPrice =
      selectedSize === "Large"
        ? Number(selectedItem.price) + 1.00
        : Number(selectedItem.price);

    const drink = {
      id: selectedItem.id,
      name: selectedItem.name,
      size: selectedSize,
      price: itemPrice,
      toppings: selectedToppings.map((t) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
      })),
    };

    setCart((prev) => [...prev, drink]);
    const modal = bootstrap.Modal.getInstance(document.getElementById("itemModal"));
    modal.hide();
  };

  const removeFromCart = (index) =>
    setCart((prev) => prev.filter((_, i) => i !== index));

  // Calculate subtotal
  const subtotal = cart.reduce(
    (sum, drink) =>
      sum +
      drink.price +
      drink.toppings.reduce((s, t) => s + t.price, 0),
    0
  );

  // Calculate tip amount
  const tipAmount = subtotal * (Number(tipPercent) / 100);

  // Calculate total
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

    const items = cart.flatMap((drink) => [
      {
        itemId: drink.id,
        name: `${drink.name} (${drink.size})`,
        price: drink.price,
      },
      ...drink.toppings.map((t) => ({
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
        setOrderSuccess(data);
        setCart([]);
        setTipPercent(0);
        alert(`Order placed! Receipt #${data.receiptId}`);
      } else {
        alert("Order failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error placing order");
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Kiosk Page</h1>

      {/* Customer info */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="First Name"
          value={customerFirst}
          onChange={(e) => setCustomerFirst(e.target.value)}
          className="form-control d-inline w-auto me-2"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={customerLast}
          onChange={(e) => setCustomerLast(e.target.value)}
          className="form-control d-inline w-auto me-2"
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="form-control d-inline w-auto"
        />
      </div>

      {/* Menu */}
      {Object.keys(groupedItems).map((cat) => (
        <div key={cat} className="mb-4">
          <h3>{cat}</h3>
          <div className="row g-2">
            {groupedItems[cat].map((item) => (
              <div key={item.id} className="col-6 col-md-3">
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => openItemModal(item)}
                >
                  {item.name} (${Number(item.price).toFixed(2)})
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Cart */}
      <div className="border-top pt-3 mt-4">
        <h4>Cart</h4>
        {cart.length === 0 ? (
          <p>No items added yet.</p>
        ) : (
          <ul className="list-group">
            {cart.map((drink, i) => (
              <li key={i} className="list-group-item">
                <div className="fw-bold">
                  {drink.name} ({drink.size}) - ${drink.price.toFixed(2)}
                </div>
                {drink.toppings.length > 0 && (
                  <ul className="ms-3 mt-1 text-muted small">
                    {drink.toppings.map((t) => (
                      <li key={t.id}>+ {t.name} (${t.price.toFixed(2)})</li>
                    ))}
                  </ul>
                )}
                <button
                  className="btn btn-sm btn-outline-danger mt-2"
                  onClick={() => removeFromCart(i)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3">
          <label className="me-2">Tip %:</label>
          <input
            type="number"
            value={tipPercent}
            onChange={(e) => setTipPercent(e.target.value)}
            className="form-control d-inline w-auto"
            style={{ width: '80px' }}
          />
        </div>

        <div className="mt-3">
          <div className="fw-normal">
            Subtotal: ${subtotal.toFixed(2)}
          </div>
          <div className="fw-normal">
            Tip ({tipPercent}%): ${tipAmount.toFixed(2)}
          </div>
          <div className="fw-bold fs-5 mt-2">
            Total: ${total.toFixed(2)}
          </div>
        </div>

        <button
          onClick={submitOrder}
          className="btn btn-primary mt-3"
        >
          Place Order
        </button>
      </div>

      {/* Bootstrap Modal */}
      <div
        className="modal fade"
        id="itemModal"
        tabIndex="-1"
        aria-labelledby="itemModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            {selectedItem && (
              <>
                <div className="modal-header">
                  <h5 className="modal-title">{selectedItem.name}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Size</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="form-select"
                    >
                      <option value="Small">Small</option>
                      <option value="Large">Large (+$1.00)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Toppings</label>
                    <div className="d-flex flex-wrap">
                      {availableToppings.length > 0 ? (
                        availableToppings.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className={`btn btn-sm m-1 ${
                              selectedToppings.find((s) => s.id === t.id)
                                ? "btn-success"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() => toggleTopping(t)}
                          >
                            {t.name} (+${Number(t.price).toFixed(2)})
                          </button>
                        ))
                      ) : (
                        <p className="text-muted small">No toppings available</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={addToCart}
                  >
                    Add to Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}