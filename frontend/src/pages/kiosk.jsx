import { useEffect, useState } from "react";
import VoiceRecorder from "../components/VoiceRecorder.jsx";
import { useLanguage } from "../context/LanguageContext";

export default function Kiosk() {
  const { t } = useLanguage();
  const [menuItems, setMenuItems] = useState([]);
  const [availableToppings, setAvailableToppings] = useState([]);

  const [cart, setCart] = useState([]);
  const [tipPercent, setTipPercent] = useState(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerFirst, setCustomerFirst] = useState("");
  const [customerLast, setCustomerLast] = useState("");
  const [usedSpeech, setUsedSpeech] = useState(false);
  const [weather, setWeather] = useState(null);

  // MANUAL UI
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedSize, setSelectedSize] = useState("Small");

  // -----------------------------
  // CONVERSATION CONTEXT
  // -----------------------------
  const [conversation, setConversation] = useState({
    step: "idle", // idle | awaitingSize | awaitingToppings
    pendingDrink: null,
  });

  // -----------------------------------
  // FEMALE VOICE SPEAKER
  // -----------------------------------
  function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = speechSynthesis
      .getVoices()
      .find((v) => v.name.toLowerCase().includes("female"));
    speechSynthesis.speak(utter);
  }

  // -------------------------
  // LOAD MENU
  // -------------------------
  const weatherIcons = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️", 51: "🌦️",
    61: "🌧️", 71: "❄️", 95: "⛈️",
  };

  // ========== VOICE COMMANDS ==========
  useEffect(() => {
    const voiceController = window.voiceController;

    if (voiceController) {
      // Order a specific item by name
      voiceController.registerCommand(
        ['order', 'add', 'I want'],
        () => {
          voiceController.speak('What would you like to order?');
        }
      );

      // View cart
      voiceController.registerCommand(
        ['view cart', 'show cart', 'check cart', 'what is in my cart'],
        () => {
          if (cart.length === 0) {
            voiceController.speak('Your cart is empty');
          } else {
            voiceController.speak(`You have ${cart.length} items in your cart`);
            // Scroll to cart
            document.querySelector('.border-top')?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      );

      // Clear cart
      voiceController.registerCommand(
        ['clear cart', 'empty cart', 'remove all'],
        () => {
          if (cart.length > 0) {
            setCart([]);
            voiceController.speak('Cart cleared');
          } else {
            voiceController.speak('Cart is already empty');
          }
        }
      );

      // Place order / Checkout
      voiceController.registerCommand(
        ['place order', 'checkout', 'complete order', 'finish order', 'submit order'],
        () => {
          const placeOrderBtn = document.querySelector('button.btn-primary');
          if (placeOrderBtn && placeOrderBtn.textContent.includes('Place Order')) {
            placeOrderBtn.click();
            voiceController.speak('Placing your order');
          }
        }
      );

      // Add to cart (when modal is open)
      voiceController.registerCommand(
        ['add to cart', 'add this', 'confirm selection'],
        () => {
          const addBtn = document.querySelector('.modal-footer .btn-primary');
          if (addBtn && addBtn.textContent.includes('Add to Cart')) {
            addBtn.click();
            voiceController.speak('Added to cart');
          }
        }
      );

      // Cancel / Close modal
      voiceController.registerCommand(
        ['cancel', 'close', 'never mind'],
        () => {
          const cancelBtn = document.querySelector('.modal-footer .btn-secondary');
          if (cancelBtn) {
            cancelBtn.click();
            voiceController.speak('Cancelled');
          }
        }
      );

      // Select size
      voiceController.registerCommand(
        ['small size', 'small', 'select small'],
        () => {
          const sizeSelect = document.querySelector('select.form-select');
          if (sizeSelect) {
            sizeSelect.value = 'Small';
            setSelectedSize('Small');
            voiceController.speak('Small size selected');
          }
        }
      );

      voiceController.registerCommand(
        ['large size', 'large', 'select large', 'make it large'],
        () => {
          const sizeSelect = document.querySelector('select.form-select');
          if (sizeSelect) {
            sizeSelect.value = 'Large';
            setSelectedSize('Large');
            voiceController.speak('Large size selected, plus one dollar');
          }
        }
      );

      // Set tip
      voiceController.registerCommand(
        ['no tip', 'zero tip', 'skip tip'],
        () => {
          setTipPercent(0);
          voiceController.speak('No tip');
        }
      );

      voiceController.registerCommand(
        ['ten percent tip', '10 percent tip', 'tip ten percent'],
        () => {
          setTipPercent(10);
          voiceController.speak('Ten percent tip');
        }
      );

      voiceController.registerCommand(
        ['fifteen percent tip', '15 percent tip', 'tip fifteen percent'],
        () => {
          setTipPercent(15);
          voiceController.speak('Fifteen percent tip');
        }
      );

      voiceController.registerCommand(
        ['twenty percent tip', '20 percent tip', 'tip twenty percent'],
        () => {
          setTipPercent(20);
          voiceController.speak('Twenty percent tip');
        }
      );

      // Remove last item
      voiceController.registerCommand(
        ['remove last', 'delete last', 'remove last item'],
        () => {
          if (cart.length > 0) {
            setCart(prev => prev.slice(0, -1));
            voiceController.speak('Removed last item');
          } else {
            voiceController.speak('Cart is empty');
          }
        }
      );

      // Scroll to menu sections
      voiceController.registerCommand(
        ['show menu', 'see menu', 'view menu'],
        () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          voiceController.speak('Showing menu');
        }
      );
    }
  }, [cart]);

  // ========== EXISTING CODE ==========

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
  // STRICT TOPPING MATCH
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

    let size = null;
    if (spoken.includes("large")) size = "Large";
    if (spoken.includes("small")) size = "Small";

    const phoneMatch = spoken.match(/\d{7,10}/);
    let phone = phoneMatch ? phoneMatch[0] : null;

    let drink = null;

    for (let item of menuItems) {
      let nm = item.name.toLowerCase();
      let matched =
        words.every((w) => nm.includes(w)) ||
        words.join(" ").includes(nm);
      if (
        matched &&
        !item.category?.toLowerCase().includes("topping")
      ) {
        drink = item;
        break;
      }
    }

    const toppingWords = availableToppings.map((t) =>
      t.name.toLowerCase()
    );
    const toppingHits = words.filter((w) =>
      toppingWords.includes(w)
    );

    const toppings = matchExactTopping(toppingHits);

    return { drink, size, toppings, phone };
  }

  // -------------------------
  // ADD TO CART (VOICE)
  // -------------------------
  function addDrinkToCart(drinkItem, size, toppings) {
    const price =
      size === "Large"
        ? Number(drinkItem.price) + 1
        : Number(drinkItem.price);
  useEffect(() => {
    const loadWeather = async () => {
      try {
        const res = await fetch("/api/weather");
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error("Weather fetch error:", err);
      }
    };

    loadWeather();
    const interval = setInterval(loadWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

    const itemPrice =
      selectedSize === "Large"
        ? Number(selectedItem.price) + 1.00
        : Number(selectedItem.price);

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
  // HANDLE VOICE INPUT
  // -------------------------
  function handleVoice(text) {
    setUsedSpeech(true);

    const spoken = text.toLowerCase();

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

    // --------------------------------
    // WAITING FOR SIZE
    // --------------------------------
    if (conversation.step === "awaitingSize") {
      let size = null;
      if (spoken.includes("large")) size = "Large";
      if (spoken.includes("small")) size = "Small";

      if (!size) {
        speak("I didn't catch the size. Say large or small.");
        return;
      }

      setConversation((prev) => ({
        step: "awaitingToppings",
        pendingDrink: { ...prev.pendingDrink, size },
      }));

      speak("Any toppings?");
      return;
    }

    // --------------------------------
    // WAITING FOR TOPPINGS
    // --------------------------------
    if (conversation.step === "awaitingToppings") {
      const { toppings } = parseSpeech(spoken);
      const finalToppings = toppings || [];

      const { drinkItem, size } = conversation.pendingDrink;

      addDrinkToCart(drinkItem, size, finalToppings);

      speak("Great, adding your drink.");

      setConversation({ step: "idle", pendingDrink: null });
      return;
    }

    // --------------------------------
    // NORMAL INPUT
    // --------------------------------
    const parsed = parseSpeech(spoken);
    const { drink, size, toppings, phone } = parsed;

    if (phone) setCustomerPhone(phone);
    else {
      const gen = "9" + Math.floor(100000000 + Math.random() * 900000000);
      setCustomerPhone(gen);
    }

    if (!drink) {
      speak("I could not understand which drink.");
      return;
    }

    // Missing size?
    if (!size) {
      speak(`What size would you like for ${drink.name}?`);
      setConversation({
        step: "awaitingSize",
        pendingDrink: { drinkItem: drink },
      });
      return;
    }

    // Missing toppings?
    if (toppings.length === 0) {
      speak("Any toppings?");
      setConversation({
        step: "awaitingToppings",
        pendingDrink: { drinkItem: drink, size },
      });
      return;
    }

    // FULL info → add
    addDrinkToCart(drink, size, toppings);
    speak(`Added your ${size} ${drink.name}.`);
  }

  // -------------------------
  // 30-SECOND SILENCE HANDLER
  // -------------------------
  function handleSilence() {
    if (conversation.step === "awaitingSize") {
      speak("I'm still here. What size would you like?");
    } else if (conversation.step === "awaitingToppings") {
      speak("Do you want any toppings?");
    }
  }

  // -------------------------
  // 5-MINUTE TIMEOUT HANDLER
  // -------------------------
  function handleFiveMinuteTimeout() {
    if (cart.length > 0) {
      speak("You've been inactive. Placing your order now.");
      submitOrder();
    }
  }

  // -------------------------
  // ORDER CALCULATIONS
  // -------------------------
  const subtotal = cart.reduce(
    (sum, d) => sum + d.price + d.toppings.reduce((s, t) => s + t.price, 0),
    0
  );

  // Calculate tip amount
  const tipAmount = subtotal * (Number(tipPercent) / 100);
  const total = subtotal + tipAmount;

  async function submitOrder() {
    let phone = customerPhone;

    if (!phone || phone.trim() === "") {
      if (usedSpeech) {
        phone = "9" + Math.floor(100000000 + Math.random() * 900000000);
        setCustomerPhone(phone);
      } else {
        alert("Phone required");
        return;
      }
  const submitOrder = async () => {
    if (!customerPhone) {
      alert(t("Customer phone is required!"));
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const items = cart.flatMap((d) => [
      {
        itemId: d.id,
        name: `${d.name} (${d.size})`,
        price: d.price,
      },
      ...d.toppings.map((t) => ({
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
        alert(t("Order placed!") + ` ${t("Receipt")} #${data.receiptId}`);
      } else {
        alert(t("Order failed:") + " " + data.error);
        setConversation({ step: "idle", pendingDrink: null });
      }
    } catch (err) {
      console.error(err);
      alert("Order failed");
    }
  }

  // -------------------------
  // MANUAL MODAL FUNCTIONS
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
  // UI
  // -------------------------
  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Kiosk Page</h1>

      <VoiceRecorder
        onText={handleVoice}
        onSilenceTimeout={handleSilence}
        onFiveMinuteTimeout={handleFiveMinuteTimeout}
      />

      {/* CUSTOMER INPUT */}
      <div className="text-center mb-4">
        <h1>{t("Kiosk Page")}</h1>

        {weather ? (
          <div style={{ fontSize: "1.5rem", marginTop: "10px" }}>
            {weatherIcons[weather.weatherCode] || "❓"}{" "}
            {weather.temperature}°F
          </div>
        ) : (
          <div className="text-muted small">{t("Loading weather...")} </div>
        )}
      </div>

      {/* Voice Command Helper */}
      <div className="alert alert-info text-center" role="alert">
        🎤 {t("Voice Commands: Say 'place order', 'view cart', 'small size', 'large size', 'ten percent tip', or click any item name!")}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder={t("First Name")}
          value={customerFirst}
          onChange={(e) => setCustomerFirst(e.target.value)}
          className="form-control d-inline w-auto me-2"
        />
        <input
          type="text"
          placeholder={t("Last Name")}
          value={customerLast}
          onChange={(e) => setCustomerLast(e.target.value)}
          className="form-control d-inline w-auto me-2"
        />
        <input
          type="text"
          placeholder={t("Phone Number")}
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="form-control d-inline w-auto"
        />
      </div>

      {/* MENU (manual UI unchanged) */}
      {Object.keys(groupedItems).map((cat) => (
        <div key={cat} className="mb-4">
          <h3>{cat}</h3>
          <div className="row g-2">
            {groupedItems[cat].map((item) => (
              <div key={item.id} className="col-6 col-md-3">
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => openItemModal(item)}
                  data-item-name={item.name}
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
        <h4>{t("Cart")}</h4>
        {cart.length === 0 ? (
          <p>{t("No items added yet.")}</p>
        ) : (
          <ul className="list-group">
            {cart.map((drink, i) => (
              <li key={i} className="list-group-item">
                <div className="fw-bold">
                  {drink.name} ({drink.size}) - $
                  {drink.price.toFixed(2)}
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
                    setCart((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                >
                  {t("Remove")}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Tip */}
        <div className="mt-3">
          <label className="me-2">{t("Tip %")}:</label>
          <input
            type="number"
            value={tipPercent}
            onChange={(e) => setTipPercent(e.target.value)}
            className="form-control d-inline w-auto"
            style={{ width: "80px" }}
          />
        </div>

        {/* Totals */}
        <div className="mt-3">
          <div className="fw-normal">
            {t("Subtotal")}: ${subtotal.toFixed(2)}
          </div>
          <div className="fw-normal">
            {t("Tip")} ({tipPercent}%): ${tipAmount.toFixed(2)}
          </div>
          <div className="fw-bold fs-5 mt-2">
            {t("Total")}: ${total.toFixed(2)}
          </div>
        </div>

        <button
          onClick={submitOrder}
          className="btn btn-primary mt-3"
        >
          {t("Place Order")}
        </button>
      </div>

      {/* MANUAL MODAL (unchanged) */}
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
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body">
                  {/* SIZE */}
                  <label className="form-label">{t("Size")}</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="form-select mb-3"
                  >
                    <option value="Small">{t("Small")}</option>
                    <option value="Large">
                      {t("Large")} (+$1.00)
                    </option>
                  </select>

                  {/* TOPPINGS */}
                  <label className="form-label">Toppings</label>
                  <div className="d-flex flex-wrap">
                    {availableToppings.map((t) => (
                      <button
                        key={t.id}
                        className={`btn btn-sm m-1 ${
                          selectedToppings.find(
                            (x) => x.id === t.id
                          )
                            ? "btn-success"
                            : "btn-outline-secondary"
                        }`}
                        onClick={() => toggleTopping(t)}
                      >
                        {t.name} (+$
                        {Number(t.price).toFixed(2)})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={addToCartManual}
                  >
                    {t("Add to Cart")}
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
