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
    <div className="main-content" style={{ 
      width: '100%', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left side - Menu */}
        <div style={{
          flex: '1 1 58%',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          backgroundColor: '#f8f9fa',
          overflowY: 'auto'
        }}>
          <h2 style={{ 
            marginBottom: '24px',
            fontSize: '28px',
            fontWeight: '600',
            color: '#333'
          }}>
            POS - Cashier
          </h2>

          {/* Category tabs */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'inline-flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: selectedCategory === cat ? '#583e23' : '#fff',
                    color: selectedCategory === cat ? '#fff' : '#333',
                    border: selectedCategory === cat ? 'none' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu grid */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '12px'
            }}>
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectItem(item)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    minHeight: '120px',
                    backgroundColor: currentItem?.id === item.id ? '#28a745' : '#fff',
                    color: currentItem?.id === item.id ? '#fff' : '#333',
                    border: currentItem?.id === item.id ? 'none' : '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '14px'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
                    {item.name}
                  </div>
                  <div style={{ 
                    fontSize: '13px',
                    opacity: currentItem?.id === item.id ? 0.9 : 0.7
                  }}>
                    ${Number(item.price).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Item customization panel */}
          {currentItem && (
            <div style={{
              marginTop: '16px',
              padding: '20px',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}>
              <h5 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                {currentItem.name}
              </h5>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                  Size:
                </label>
                <div style={{ display: 'inline-flex', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentSize("Small")}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: currentSize === "Small" ? '#583e23' : '#fff',
                      color: currentSize === "Small" ? '#fff' : '#333',
                      border: currentSize === "Small" ? 'none' : '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Small
                  </button>
                  <button
                    onClick={() => setCurrentSize("Large")}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: currentSize === "Large" ? '#583e23' : '#fff',
                      color: currentSize === "Large" ? '#fff' : '#333',
                      border: currentSize === "Large" ? 'none' : '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Large (+$1.00)
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                  Toppings:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableToppings.map((topping) => (
                    <button
                      key={topping.id}
                      onClick={() => toggleTopping(topping)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: currentToppings.find((t) => t.id === topping.id) ? '#28a745' : '#fff',
                        color: currentToppings.find((t) => t.id === topping.id) ? '#fff' : '#333',
                        border: currentToppings.find((t) => t.id === topping.id) ? 'none' : '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {topping.name} (+${Number(topping.price).toFixed(2)})
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                  Sugar Level:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {["0%", "25%", "50%", "75%", "100%"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCurrentSugar(lvl)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: currentSugar === lvl ? '#583e23' : '#fff',
                        color: currentSugar === lvl ? '#fff' : '#333',
                        border: currentSugar === lvl ? 'none' : '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                  Ice Level:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {["0%", "25%", "50%", "75%", "100%"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCurrentIce(lvl)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: currentIce === lvl ? '#583e23' : '#fff',
                        color: currentIce === lvl ? '#fff' : '#333',
                        border: currentIce === lvl ? 'none' : '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={addToCart}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#583e23',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* Right side - Cart & Checkout */}
        <div style={{
          flex: '1 1 42%',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          backgroundColor: '#fff',
          borderLeft: '1px solid #e0e0e0',
          overflowY: 'auto'
        }}>
          <h4 style={{ 
            marginBottom: '20px',
            fontSize: '22px',
            fontWeight: '600',
            color: '#333'
          }}>
            Current Order
          </h4>

          {/* Customer info */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Phone Number *"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                marginBottom: '12px'
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="First Name"
                value={customerFirst}
                onChange={(e) => setCustomerFirst(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={customerLast}
                onChange={(e) => setCustomerLast(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>

          {/* Cart items */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#fafafa'
          }}>
            {cart.length === 0 ? (
              <p style={{ 
                textAlign: 'center',
                color: '#999',
                marginTop: '20px',
                fontSize: '14px'
              }}>
                No items in cart
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map((item, i) => (
                  <div key={i} style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>
                          {item.name} ({item.size})
                        </div>
                        {item.toppings.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            {item.toppings.map((t) => t.name).join(", ")}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Sugar: {item.sugar} | Ice: {item.ice}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '15px' }}>
                          ${(item.price + item.toppings.reduce((s, t) => s + t.price, 0)).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeFromCart(i)}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: 'transparent',
                            color: '#dc3545',
                            border: '1px solid #dc3545',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
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
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Payment Method:
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Digital">Digital Wallet</option>
            </select>
          </div>

          {/* Tip */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Tip %:
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="number"
                value={tipPercent}
                onChange={(e) => setTipPercent(e.target.value)}
                min="0"
                max="100"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px'
                }}
              />
              <span style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                %
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[10, 15, 20, 0].map((tip) => (
                <button
                  key={tip}
                  onClick={() => setTipPercent(tip)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#fff',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {tip === 0 ? 'No Tip' : `${tip}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div style={{
            borderTop: '1px solid #ddd',
            paddingTop: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#666'
            }}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#666'
            }}>
              <span>Tip ({tipPercent}%):</span>
              <span>${tipAmount.toFixed(2)}</span>
            </div>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: '600',
              fontSize: '20px',
              borderTop: '2px solid #333',
              paddingTop: '12px',
              color: '#333'
            }}>
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={submitOrder}
              disabled={cart.length === 0 || !customerPhone}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: (cart.length === 0 || !customerPhone) ? '#ccc' : '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (cart.length === 0 || !customerPhone) ? 'not-allowed' : 'pointer'
              }}
            >
              Complete Order
            </button>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                color: cart.length === 0 ? '#ccc' : '#dc3545',
                border: `1px solid ${cart.length === 0 ? '#ccc' : '#dc3545'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}