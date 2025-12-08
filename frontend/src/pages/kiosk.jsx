import { useEffect, useState } from "react";

// Mock VoiceRecorder component
const VoiceRecorder = ({ onText, onSilenceTimeout, onFiveMinuteTimeout }) => {
  return <div style={{ display: 'none' }} />;
};

// Mock translation function
const t = (key) => key;

export default function Kiosk() {
  const [menuItems, setMenuItems] = useState([]);
  const [availableToppings, setAvailableToppings] = useState([]);

  const [cart, setCart] = useState([]);
  const [tipPercent, setTipPercent] = useState(0);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerFirst, setCustomerFirst] = useState("");
  const [customerLast, setCustomerLast] = useState("");
  const [usedSpeech, setUsedSpeech] = useState(false);
  const [weather, setWeather] = useState(null);
  const [sugarLevel, setSugarLevel] = useState("100%");
  const [iceLevel, setIceLevel] = useState("100%");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // MANUAL UI
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [selectedSize, setSelectedSize] = useState("Small");

  // CONVERSATION CONTEXT
  const [conversation, setConversation] = useState({
    step: "idle",
    pendingDrink: null,
  });

  const formatPhone = (value = "") => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 3));
    if (digits.length > 3) parts.push(digits.slice(3, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 10));
    return { formatted: parts.join("-"), digits };
  };

  // SPEECH UTTER
  function speak(text) {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      utter.voice =
        voices.find((v) => v.name.toLowerCase().includes("female")) ||
        voices[0] ||
        null;
      speechSynthesis.speak(utter);
    } catch (err) {
      console.warn("speak error:", err);
    }
  }

  // WEATHER ICONS
  const weatherIcons = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    61: "🌧️",
    71: "❄️",
    95: "⛈️",
  };

  // ========== VOICE COMMANDS (register) ==========
  useEffect(() => {
    const voiceController = window.voiceController;
    if (!voiceController) return;

    const getCartLength = () => document.querySelectorAll(".cart-item")?.length || cart.length;

    try {
      voiceController.registerCommand(
        ["order", "add", "I want"],
        () => {
          voiceController.speak("What would you like to order?");
        }
      );

      voiceController.registerCommand(
        ["view cart", "show cart", "check cart", "what is in my cart"],
        () => {
          if (getCartLength() === 0) {
            voiceController.speak("Your cart is empty");
          } else {
            voiceController.speak(`You have ${getCartLength()} items in your cart`);
          }
        }
      );

      voiceController.registerCommand(
        ["clear cart", "empty cart", "remove all"],
        () => {
          if (cart.length > 0) {
            setCart([]);
            voiceController.speak("Cart cleared");
          } else {
            voiceController.speak("Cart is already empty");
          }
        }
      );

      voiceController.registerCommand(
        ["place order", "checkout", "complete order", "finish order", "submit order"],
        () => {
          voiceController.speak("Placing your order");
          submitOrder();
        }
      );

      voiceController.registerCommand(
        ["add to cart", "add this", "confirm selection"],
        () => {
          addToCartManual();
          voiceController.speak("Added to cart");
        }
      );

      voiceController.registerCommand(
        ["cancel", "close", "never mind"],
        () => {
          setSelectedItem(null);
          voiceController.speak("Cancelled");
        }
      );

      voiceController.registerCommand(
        ["small size", "small", "select small"],
        () => {
          setSelectedSize("Small");
          voiceController.speak("Small size selected");
        }
      );

      voiceController.registerCommand(
        ["large size", "large", "select large", "make it large"],
        () => {
          setSelectedSize("Large");
          voiceController.speak("Large size selected, plus one dollar");
        }
      );

      voiceController.registerCommand(
        ["no tip", "zero tip", "skip tip"],
        () => {
          setTipPercent(0);
          voiceController.speak("No tip");
        }
      );

      voiceController.registerCommand(
        ["ten percent tip", "10 percent tip", "tip ten percent"],
        () => {
          setTipPercent(10);
          voiceController.speak("Ten percent tip");
        }
      );

      voiceController.registerCommand(
        ["fifteen percent tip", "15 percent tip", "tip fifteen percent"],
        () => {
          setTipPercent(15);
          voiceController.speak("Fifteen percent tip");
        }
      );

      voiceController.registerCommand(
        ["twenty percent tip", "20 percent tip", "tip twenty percent"],
        () => {
          setTipPercent(20);
          voiceController.speak("Twenty percent tip");
        }
      );

      voiceController.registerCommand(
        ["remove last", "delete last", "remove last item"],
        () => {
          if (cart.length > 0) {
            setCart((prev) => prev.slice(0, -1));
            voiceController.speak("Removed last item");
          } else {
            voiceController.speak("Cart is empty");
          }
        }
      );

      voiceController.registerCommand(
        ["show menu", "see menu", "view menu"],
        () => {
          voiceController.speak("Showing menu");
        }
      );
    } catch (err) {
      console.warn("voiceController registration error:", err);
    }

    return () => { };
  }, [cart, selectedSize, selectedToppings, menuItems, tipPercent, usedSpeech]);

  // ========== LOAD MENU ==========
  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setMenuItems(data.items);
          setAvailableToppings(
            data.items.filter((i) => i.category?.toLowerCase().includes("topping"))
          );

          const firstCategory = data.items.find(i => !i.category?.toLowerCase().includes("topping"))?.category;
          if (firstCategory) {
            setSelectedCategory(firstCategory);
          }
        }
      })
      .catch(console.error);
  }, []);

  // ========== WEATHER ==========
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

  // HELPERS
  function matchExactTopping(words) {
    return availableToppings.filter((t) => words.includes(t.name.toLowerCase()));
  }

  function parseSpeech(text) {
    const spoken = text.toLowerCase().replace(/[^\w\s]/gi, "").trim();
    const words = spoken.split(/\s+/).filter(Boolean);

    let size = null;
    if (spoken.includes("large")) size = "Large";
    if (spoken.includes("small")) size = "Small";

    const phoneMatch = spoken.match(/\d{10}/);
    let phone = phoneMatch ? phoneMatch[0] : null;
    if (phone) {
      const { formatted, digits } = formatPhone(phone);
      phone = digits.length === 10 ? formatted : null;
    }

    let drink = null;
    for (let item of menuItems) {
      const nm = item.name.toLowerCase();
      const matched = words.every((w) => nm.includes(w)) || words.join(" ").includes(nm);
      if (matched && !item.category?.toLowerCase().includes("topping")) {
        drink = item;
        break;
      }
    }

    const toppingWords = availableToppings.map((t) => t.name.toLowerCase());
    const toppingHits = words.filter((w) => toppingWords.includes(w));
    const toppings = matchExactTopping(toppingHits);

    return { drink, size, toppings, phone };
  }

  function addDrinkToCart(drinkItem, size, toppings = []) {
    if (!drinkItem) return;

    const price = size === "Large" ? Number(drinkItem.price) + 1 : Number(drinkItem.price);

    const drink = {
      id: drinkItem.id,
      name: drinkItem.name,
      size: size,
      price,
      sugarLevel: sugarLevel,
      iceLevel: iceLevel,
      toppings: toppings.map((t) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
      })),
    };

    setCart((prev) => [...prev, drink]);
    setSelectedItem(null);
  }

  function addToCartManual() {
    if (!selectedItem) return;

    const price = selectedSize === "Large" ? Number(selectedItem.price) + 1 : Number(selectedItem.price);

    const drink = {
      id: selectedItem.id,
      name: selectedItem.name,
      size: selectedSize,
      price,
      sugarLevel: sugarLevel,
      iceLevel: iceLevel,
      toppings: selectedToppings.map((t) => ({
        id: t.id,
        name: t.name,
        price: Number(t.price),
      })),
    };

    setCart((prev) => [...prev, drink]);
    setSelectedItem(null);
  }

  const submitOrder = async () => {
    let phone = customerPhone;
    let phoneDigits = formatPhone(phone).digits;

    if (!phoneDigits) {
      if (usedSpeech) {
        const generated = "9" + Math.floor(100000000 + Math.random() * 900000000);
        const { formatted, digits } = formatPhone(generated);
        phone = formatted;
        phoneDigits = digits;
        setCustomerPhone(formatted);
      } else {
        alert(t("Customer phone is required!"));
        return;
      }
    }

    if (phoneDigits.length !== 10) {
      alert(t("Phone number must be 10 digits (format xxx-xxx-xxxx)."));
      return;
    }

    const { formatted: normalizedPhone } = formatPhone(phoneDigits);
    phone = normalizedPhone;
    setCustomerPhone(normalizedPhone);

    if (cart.length === 0) {
      alert(t("Cart is empty!"));
      return;
    }

    setIsSubmitting(true);

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
      customer: { firstName: customerFirst, lastName: customerLast, phone: phoneDigits },
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
        if (data.rewardApplied) {
          const isFree = data.discount >= data.subtotal;
          const rewardSpeech = isFree ? t("Great news! Your drink is free.") : t("You received 20% off your order!");
          speak(rewardSpeech);
          const rewardLabel = isFree ? t("FREE DRINK APPLIED!") : t("20% OFF APPLIED!");
          const rewardLine = isFree ? t("This drink is free!") : t("20% off applied for multiple drinks.");
          alert(`${rewardLabel}\n\n${rewardLine}\n\n${t("Receipt")} #${data.receiptId}\nSubtotal: $${data.subtotal.toFixed(2)}\nDiscount: -$${data.discount.toFixed(2)}\nTotal: $${data.total.toFixed(2)}`);
        } else {
          speak(t("Your order has been placed."));
          alert(t("Order placed!") + ` ${t("Receipt")} #${data.receiptId}`);
        }
        setCart([]);
        setTipPercent(0);
        setCustomerPhone("");
        setCustomerFirst("");
        setCustomerLast("");
        setConversation({ step: "idle", pendingDrink: null });
      } else {
        alert(t("Order failed:") + " " + (data.error || ""));
        setConversation({ step: "idle", pendingDrink: null });
      }
    } catch (err) {
      console.error(err);
      alert(t("Order failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleVoice(text) {
    setUsedSpeech(true);
    const spoken = text.toLowerCase();

    if (spoken.includes("remove last")) {
      setCart((prev) => prev.slice(0, -1));
      speak("Removed the last drink.");
      return;
    }

    const tipMatch = spoken.match(/tip (\d{1,2})/);
    if (tipMatch) {
      setTipPercent(Number(tipMatch[1]));
      speak(`Tip set to ${tipMatch[1]} percent.`);
      return;
    }

    if (spoken.includes("done") || spoken.includes("finish") || spoken.includes("place order")) {
      speak("Placing your order.");
      submitOrder();
      return;
    }

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

    if (conversation.step === "awaitingToppings") {
      const { toppings } = parseSpeech(spoken);
      const finalToppings = toppings || [];

      const { drinkItem, size } = conversation.pendingDrink || {};
      if (!drinkItem) {
        speak("Something went wrong. Please try again.");
        setConversation({ step: "idle", pendingDrink: null });
        return;
      }

      addDrinkToCart(drinkItem, size, finalToppings);
      speak("Great, adding your drink.");
      setConversation({ step: "idle", pendingDrink: null });
      return;
    }

    const parsed = parseSpeech(spoken);
    const { drink, size, toppings, phone } = parsed;

    if (phone) {
      setCustomerPhone(phone);
    } else if (!customerPhone) {
      const gen = "9" + Math.floor(100000000 + Math.random() * 900000000);
      setCustomerPhone(formatPhone(gen).formatted);
    }

    if (!drink) {
      speak("I could not understand which drink.");
      return;
    }

    if (!size) {
      speak(`What size would you like for ${drink.name}?`);
      setConversation({
        step: "awaitingSize",
        pendingDrink: { drinkItem: drink },
      });
      return;
    }

    if (!toppings || toppings.length === 0) {
      speak("Any toppings?");
      setConversation({
        step: "awaitingToppings",
        pendingDrink: { drinkItem: drink, size },
      });
      return;
    }

    addDrinkToCart(drink, size, toppings);
    speak(`Added your ${size} ${drink.name}.`);
  }

  function handleSilence() {
    if (conversation.step === "awaitingSize") {
      speak("I'm still here. What size would you like?");
    } else if (conversation.step === "awaitingToppings") {
      speak("Do you want any toppings?");
    }
  }

  function handleFiveMinuteTimeout() {
    if (cart.length > 0) {
      speak("You've been inactive. Placing your order now.");
      submitOrder();
    }
  }

  const groupedItems = menuItems
    .filter((i) => !i.category?.toLowerCase().includes("topping"))
    .reduce((acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

  const subtotal = cart.reduce(
    (sum, d) => sum + Number(d.price || 0) + (d.toppings?.reduce((s, t) => s + Number(t.price || 0), 0) || 0),
    0
  );
  const tipAmount = subtotal * (Number(tipPercent || 0) / 100);
  const total = subtotal + tipAmount;

  const openItemModal = (item) => {
    if (item.category?.toLowerCase().includes("topping")) return;
    setSelectedItem(item);
    setSelectedSize("Small");
    setSelectedToppings([]);
    setSugarLevel("100%");
    setIceLevel("100%");
  };

  const toggleTopping = (t) => {
    setSelectedToppings((prev) =>
      prev.find((x) => x.id === t.id) ? prev.filter((x) => x.id !== t.id) : [...prev, t]
    );
  };

  const categories = Object.keys(groupedItems);

  return (
    <div className="main-content">
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <VoiceRecorder
          onText={handleVoice}
          onSilenceTimeout={handleSilence}
          onFiveMinuteTimeout={handleFiveMinuteTimeout}
        />

        {/* LEFT SIDEBAR */}
        <div style={{
          width: '260px',
          backgroundColor: '#fff',
          borderRight: '1px solid #e0e0e0',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            color: '#333',
            fontSize: '22px',
            fontWeight: '700',
            marginBottom: '20px',
            paddingLeft: '8px'
          }}>
            Categories
          </div>

          {weather && (
            <div style={{
              color: '#333',
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '500',
              marginBottom: '16px'
            }}>
              {weatherIcons[weather.weatherCode] || "❓"} {weather.temperature}°F
            </div>
          )}

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '18px 16px',
                backgroundColor: selectedCategory === cat ? '#583e23' : '#fff',
                color: selectedCategory === cat ? '#fff' : '#333',
                border: selectedCategory === cat ? 'none' : '1px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                boxShadow: selectedCategory === cat ? '0 2px 8px rgba(88,62,35,0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.backgroundColor = '#fff';
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          <div style={{
            backgroundColor: '#fff',
            padding: '20px 30px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600', color: '#333' }}>
              {t("Kiosk Page")}
            </h1>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={t("First Name")}
                value={customerFirst}
                onChange={(e) => setCustomerFirst(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  width: '130px'
                }}
              />
              <input
                type="text"
                placeholder={t("Last Name")}
                value={customerLast}
                onChange={(e) => setCustomerLast(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  width: '130px'
                }}
              />
              <input
                type="text"
                placeholder={t("Phone Number")}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(formatPhone(e.target.value).formatted)}
                style={{
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  width: '150px'
                }}
              />
            </div>
          </div>

          <div style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px',
            alignContent: 'start',
            backgroundColor: '#fafafa'
          }}>
            {selectedCategory && groupedItems[selectedCategory]?.map((item) => (
              <button
                key={item.id}
                onClick={() => openItemModal(item)}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '240px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                }}
              >
                <div style={{
                  width: '100%',
                  height: '150px',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '56px'
                }}>
                  🧋
                </div>

                <div style={{ padding: '14px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#333',
                    marginBottom: '6px'
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#666'
                  }}>
                    ${Number(item.price).toFixed(2)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>


        {/* RIGHT SIDEBAR */}
        <div style={{
          width: '360px',
          backgroundColor: '#fff',
          borderLeft: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#fafafa'
          }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: '#333' }}>
              {t("Cart")}
            </h2>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#999',
                padding: '40px 20px',
                fontSize: '15px'
              }}>
                {t("No items added yet.")}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map((drink, i) => (
                  <div key={i} className="cart-item" style={{
                    backgroundColor: '#fafafa',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{
                      fontWeight: '500',
                      fontSize: '14px',
                      marginBottom: '6px',
                      color: '#333'
                    }}>
                      {drink.name} ({drink.size})
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#666',
                      marginBottom: '6px'
                    }}>
                      Sugar: {drink.sugarLevel} | Ice: {drink.iceLevel}
                    </div>
                    <div style={{
                      fontWeight: '600',
                      color: '#333',
                      fontSize: '14px',
                      marginBottom: '8px'
                    }}>
                      ${Number(drink.price).toFixed(2)}
                    </div>

                    {drink.toppings?.length > 0 && (
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: '10px',
                        paddingLeft: '8px'
                      }}>
                        {drink.toppings.map((t) => (
                          <div key={t.id}>
                            + {t.name} (${Number(t.price).toFixed(2)})
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setCart((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#dc3545',
                        border: '1px solid #dc3545',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      {t("Remove")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#fafafa'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block', color: '#333' }}>
                {t("Tip %")}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[0, 10, 15, 20].map((tip) => (
                  <button
                    key={tip}
                    onClick={() => setTipPercent(tip)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: tipPercent === tip ? '#333' : '#fff',
                      color: tipPercent === tip ? '#fff' : '#666',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}
                  >
                    {tip}%
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '15px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                color: '#666'
              }}>
                <span>{t("Subtotal")}:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                color: '#666'
              }}>
                <span>{t("Tip")} ({tipPercent}%):</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: '600',
                paddingTop: '10px',
                borderTop: '1px solid #ddd',
                color: '#333'
              }}>
                <span>{t("Total")}:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={submitOrder}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: isSubmitting ? '#ccc' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? t("Processing...") : t("Place Order")}
            </button>
          </div>
        </div>

        {/* MODAL */}
        {selectedItem && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
            }}>
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: '#333' }}>
                  {selectedItem.name}
                </h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: '#999',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                    lineHeight: '28px'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                padding: '24px',
                overflowY: 'auto',
                flex: 1
              }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    fontSize: '15px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '12px',
                    color: '#333'
                  }}>
                    {t("Size")}
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setSelectedSize('Small')}
                      style={{
                        flex: 1,
                        padding: '14px',
                        backgroundColor: selectedSize === 'Small' ? '#333' : '#fff',
                        color: selectedSize === 'Small' ? '#fff' : '#666',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {t("Small")}
                    </button>
                    <button
                      onClick={() => setSelectedSize('Large')}
                      style={{
                        flex: 1,
                        padding: '14px',
                        backgroundColor: selectedSize === 'Large' ? '#333' : '#fff',
                        color: selectedSize === 'Large' ? '#fff' : '#666',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {t("Large")} (+$1.00)
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    fontSize: '15px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '12px',
                    color: '#333'
                  }}>
                    Sugar Level
                  </label>
                  <select
                    value={sugarLevel}
                    onChange={(e) => setSugarLevel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      color: '#333'
                    }}
                  >
                    <option>0%</option>
                    <option>25%</option>
                    <option>50%</option>
                    <option>75%</option>
                    <option>100%</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    fontSize: '15px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '12px',
                    color: '#333'
                  }}>
                    Ice Level
                  </label>
                  <select
                    value={iceLevel}
                    onChange={(e) => setIceLevel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      color: '#333'
                    }}
                  >
                    <option>0%</option>
                    <option>25%</option>
                    <option>50%</option>
                    <option>75%</option>
                    <option>100%</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    fontSize: '15px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '12px',
                    color: '#333'
                  }}>
                    Toppings
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '10px'
                  }}>
                    {availableToppings.map((topping) => (
                      <button
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        style={{
                          padding: '12px',
                          backgroundColor: selectedToppings.find((x) => x.id === topping.id) ? '#333' : '#fff',
                          color: selectedToppings.find((x) => x.id === topping.id) ? '#fff' : '#666',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {topping.name}
                        <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                          +${Number(topping.price).toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '20px 24px',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                gap: '12px',
                backgroundColor: '#fafafa'
              }}>
                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#fff',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={addToCartManual}
                  style={{
                    flex: 2,
                    padding: '14px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {t("Add to Cart")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {isSubmitting && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <h3 style={{ color: 'white', marginTop: '24px', fontSize: '20px', fontWeight: '500' }}>
              {t("Processing Your Order...")}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginTop: '8px' }}>
              {t("Please wait")}
            </p>
          </div>
        )}

        <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </div>
  );
}