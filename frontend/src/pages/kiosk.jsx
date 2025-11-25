import { useEffect, useState } from "react";
import VoiceRecorder from "../components/VoiceRecorder.jsx";

export default function Kiosk() {
  const [menuItems, setMenuItems] = useState([]);
  const [availableToppings, setAvailableToppings] = useState([]);

  const [cart, setCart] = useState([]);
  const [tipPercent, setTipPercent] = useState(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerFirst, setCustomerFirst] = useState("");
  const [customerLast, setCustomerLast] = useState("");
  const [usedSpeech, setUsedSpeech] = useState(false);

  // Manual modal-only UI
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedSize, setSelectedSize] = useState("Small");

  // -------------------------
  // CONVERSATION STATE MACHINE
  // -------------------------
  const [conversation, setConversation] = useState({
    step: "idle", // idle | awaitingSize | awaitingToppings
    pendingDrink: null,
  });

  // -------------------------
  // LOAD MENU
  // -------------------------
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

  // -------------------------
  // STRICT TOPPING MATCHER
  // “pearl” ≠ “white pearl”
  // -------------------------
  function matchExactTopping(words) {
    return availableToppings.filter((t) =>
      words.includes(t.name.toLowerCase())
    );
  }

  // -------------------------
  // PARSE SPEECH
  // -------------------------
  function parseSpeech(text) {
    const spoken = text
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .trim();

    const words = spoken.split(" ");

    // Size
    let size = null;
    if (spoken.includes("large")) size = "Large";
    if (spoken.includes("small")) size = "Small";

    // Phone
    const phoneMatch = spoken.match(/\d{7,10}/);
    let phone = phoneMatch ? phoneMatch[0] : null;

    // Drink match
    let drink = null;

    for (let item of menuItems) {
      let nm = item.name.toLowerCase();
      let matched = words.every((w) => nm.includes(w) || words.join(" ").includes(nm));
      if (matched && !item.category?.toLowerCase().includes("topping")) {
        drink = item;
        break;
      }
    }

    // Toppings (strict)
    const toppingWords = availableToppings.map((t) => t.name.toLowerCase());
    const toppingHits = words.filter((w) => toppingWords.includes(w));

    const toppings = matchExactTopping(toppingHits);

    return { drink, size, toppings, phone };
  }

  // -------------------------
  // CART ADD (VOICE MODE)
  // -------------------------
  function addDrinkToCart(drinkItem, size, toppings) {
    const price =
      size === "Large"
        ? Number(drinkItem.price) + 1
        : Number(drinkItem.price);

    const drink = {
      id: drinkItem.id,
      name: drinkItem.name,
      size,
      price,
      toppings: toppings.map((t) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
      })),
    };

    setCart((prev) => [...prev, drink]);
  }

  // -------------------------
  // SPEAK HELPER
  // -------------------------
  function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = speechSynthesis.getVoices().find((v) =>
      v.name.toLowerCase().includes("female")
    );
    speechSynthesis.speak(utter);
  }

  // -------------------------
  // HANDLE VOICE INPUT
  // -------------------------
  function handleVoice(text) {
    setUsedSpeech(true);
    const spoken = text.toLowerCase();
    console.log("USER SAID:", spoken);

    // REMOVE LAST
    if (spoken.includes("remove last")) {
      setCart((prev) => prev.slice(0, -1));
      speak("Removed the last drink.");
      return;
    }

    // TIP
    const tipMatch = spoken.match(/tip (\d{1,2})/);
    if (tipMatch) {
      setTipPercent(Number(tipMatch[1]));
      speak(`Tip set to ${tipMatch[1]} percent.`);
      return;
    }

    // FINISH ORDER
    if (
      spoken.includes("done") ||
      spoken.includes("finish") ||
      spoken.includes("place order")
    ) {
      speak("Placing your order.");
      submitOrder();
      return;
    }

    // If we are WAITING on size
    if (conversation.step === "awaitingSize") {
      let size = null;
      if (spoken.includes("large")) size = "Large";
      if (spoken.includes("small")) size = "Small";

      if (!size) {
        speak("I didn't catch the size. Say large or small.");
        return;
      }

      setConversation((prev) => ({
        ...prev,
        pendingDrink: { ...prev.pendingDrink, size },
        step: "awaitingToppings",
      }));

      speak("Any toppings?");
      return;
    }

    // Waiting for toppings
    if (conversation.step === "awaitingToppings") {
      const toppingCandidates = parseSpeech(spoken).toppings;

      const toppings = toppingCandidates || [];

      const { drinkItem, size } = conversation.pendingDrink;

      addDrinkToCart(drinkItem, size, toppings);
      speak("Great, adding that drink.");
      setConversation({ step: "idle", pendingDrink: null });
      return;
    }

    // Normal parsing
    const { drink, size, toppings, phone } = parseSpeech(spoken);

    // Phone auto-assign if needed
    if (phone) setCustomerPhone(phone);
    else {
      const gen = "9" + Math.floor(100000000 + Math.random() * 900000000);
      setCustomerPhone(gen);
    }

    if (!drink) {
      speak("I could not understand the drink.");
      return;
    }

    // If NO size → ask for size
    if (!size) {
      setConversation({
        step: "awaitingSize",
        pendingDrink: { drinkItem: drink },
      });
      speak(`What size would you like for ${drink.name}?`);
      return;
    }

    // If size but no toppings → ask toppings
    if (size && toppings.length === 0) {
      setConversation({
        step: "awaitingToppings",
        pendingDrink: { drinkItem: drink, size },
      });
      speak("Any toppings?");
      return;
    }

    // If we have everything → add automatically
    addDrinkToCart(drink, size, toppings);
    speak(`Added your ${size} ${drink.name}.`);
  }

  // -------------------------
  // SUBMIT ORDER
  // -------------------------
  const subtotal = cart.reduce(
    (sum, d) => sum + d.price + d.toppings.reduce((s, t) => s + t.price, 0),
    0
  );
  const tipAmount = subtotal * (Number(tipPercent) / 100);
  const total = subtotal + tipAmount;

  async function submitOrder() {
    let phone = customerPhone;

    if (!phone || phone.trim() === "") {
      if (usedSpeech) {
        phone = "9" + Math.floor(100000000 + Math.random() * 900000000);
        setCustomerPhone(phone);
      } else {
        alert("Enter phone");
        return;
      }
    }

    if (cart.length === 0) {
      alert("Cart empty");
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
      customer: { firstName: customerFirst, lastName: customerLast, phone },
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
        speak("Your order has been placed.");
        alert(`Order placed. Receipt #${data.receiptId}`);
        setCart([]);
        setTipPercent(0);
      } else {
        alert("Order failed");
      }
    } catch (err) {
      alert("Error");
    }
  }

  // -------------------------
  // MANUAL MODAL (unchanged)
  // -------------------------
  const groupedItems = menuItems
    .filter((i) => !i.category?.toLowerCase().includes("topping"))
    .reduce((acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

  function openItemModal(item) {
    setSelectedItem(item);
    setSelectedSize("Small");
    setSelectedToppings([]);

    const modal = new bootstrap.Modal(document.getElementById("itemModal"));
    modal.show();
  }

  function toggleTopping(t) {
    setSelectedToppings((prev) =>
      prev.find((x) => x.id === t.id)
        ? prev.filter((x) => x.id !== t.id)
        : [...prev, t]
    );
  }

  function addToCartManual() {
    const price =
      selectedSize === "Large"
        ? Number(selectedItem.price) + 1
        : Number(selectedItem.price);

    const drink = {
      id: selectedItem.id,
      name: selectedItem.name,
      size: selectedSize,
      price,
      toppings: selectedToppings.map((t) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
      })),
    };

    setCart((prev) => [...prev, drink]);

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("itemModal")
    );
    modal.hide();
  }

  // -------------------------
  // UI RENDER
  // -------------------------
  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Kiosk Page</h1>

      <VoiceRecorder onText={handleVoice} />

      {/* CUSTOMER INFO */}
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

      {/* MENU */}
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

      {/* CART */}
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
                      <li key={t.id}>
                        + {t.name} (${t.price.toFixed(2)})
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  className="btn btn-sm btn-outline-danger mt-2"
                  onClick={() =>
                    setCart((prev) => prev.filter((_, idx) => idx !== i))
                  }
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
            style={{ width: "80px" }}
          />
        </div>

        <div className="mt-3">
          <div>Subtotal: ${subtotal.toFixed(2)}</div>
          <div>Tip ({tipPercent}%): ${tipAmount.toFixed(2)}</div>
          <div className="fw-bold fs-5 mt-2">Total: ${total.toFixed(2)}</div>
        </div>

        <button onClick={submitOrder} className="btn btn-primary mt-3">
          Place Order
        </button>
      </div>

      {/* MANUAL MODAL */}
      <div
        className="modal fade"
        id="itemModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            {selectedItem && (
              <>
                <div className="modal-header">
                  <h5 className="modal-title">{selectedItem.name}</h5>
                  <button
                    className="btn-close"
                    data-bs-dismiss="modal"
                  ></button>
                </div>

                <div className="modal-body">
                  {/* SIZE */}
                  <label className="form-label">Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="form-select mb-3"
                  >
                    <option value="Small">Small</option>
                    <option value="Large">Large (+$1.00)</option>
                  </select>

                  {/* TOPPINGS */}
                  <label className="form-label">Toppings</label>
                  <div className="d-flex flex-wrap">
                    {availableToppings.map((t) => (
                      <button
                        key={t.id}
                        className={`btn btn-sm m-1 ${
                          selectedToppings.find((x) => x.id === t.id)
                            ? "btn-success"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => toggleTopping(t)}
                      >
                        {t.name} (+${Number(t.price).toFixed(2)})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={addToCartManual}>
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
