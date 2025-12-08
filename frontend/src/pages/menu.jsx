import { useEffect, useState, useMemo } from "react";

// Mock language context for demo
const useLanguage = () => ({
  t: (key) => {
    const translations = {
      "BOBA MENU": "BOBA MENU",
      "Handcrafted Daily": "Handcrafted Daily",
      "Search drinks...": "Search drinks...",
      "No items found": "No items found",
      "Thank You": "Thank You",
      "Made Fresh with Premium Ingredients": "Made Fresh with Premium Ingredients",
      "Other": "Other"
    };
    return translations[key] || key;
  }
});

export default function MenuBoard() {
  const { t } = useLanguage();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Mock data for demo - replace with your actual fetch
    // setTimeout(() => {
    //   setMenuItems([
    //     { id: 1, name: "Classic Milk Tea", price: 5.50, category: "Milk Tea" },
    //     { id: 2, name: "Taro Milk Tea", price: 6.00, category: "Milk Tea" },
    //     { id: 3, name: "Thai Tea", price: 5.75, category: "Milk Tea" },
    //     { id: 4, name: "Matcha Latte", price: 6.50, category: "Specialty" },
    //     { id: 5, name: "Brown Sugar Boba", price: 6.25, category: "Specialty" },
    //     { id: 6, name: "Mango Smoothie", price: 6.00, category: "Fruit Tea" },
    //     { id: 7, name: "Strawberry Tea", price: 5.50, category: "Fruit Tea" },
    //     { id: 8, name: "Passion Fruit Tea", price: 5.75, category: "Fruit Tea" },
    //     { id: 9, name: "Lychee Tea", price: 5.50, category: "Fruit Tea" },
    //     { id: 10, name: "Peach Tea", price: 5.50, category: "Fruit Tea" },
    //     { id: 11, name: "Jasmine Green Tea", price: 4.50, category: "Classic Tea" },
    //     { id: 12, name: "Oolong Tea", price: 4.75, category: "Classic Tea" },
    //   ]);
    //   setLoading(false);
    // }, 500);

    // Your actual fetch code:
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setMenuItems(data.items);
        } else if (Array.isArray(data)) {
          setMenuItems(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading menu:", err);
        setLoading(false);
      });
  }, []);

  const groupedItems = useMemo(() => {
    const filtered = searchQuery
      ? menuItems.filter((item) =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : menuItems;

    const groups = {};
    filtered.forEach((item) => {
      if (item.id && item.name && item.price != null) {
        const cat = item.category || t("Other");
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      }
    });

    return groups;
  }, [menuItems, searchQuery, t]);

  const categories = Object.keys(groupedItems).sort();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#fff3e0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #78350f',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '16px', fontSize: '20px', fontWeight: '600', color: '#78350f' }}>
            Loading Menu...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #fff3e0, #ffe0b2, #fff3e0)',
      margin: '0',
      padding: '0',
      position: 'relative',
      overflow: 'hidden',
      marginLeft: '240px'
    }}>
      {/* Decorative Images */}
      <div style={{
        position: 'fixed',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '120px',
        opacity: '0.15',
        pointerEvents: 'none',
        zIndex: '1'
      }}>🧋</div>
      
      <div style={{
        position: 'fixed',
        right: '20px',
        top: '30%',
        fontSize: '120px',
        opacity: '0.15',
        pointerEvents: 'none',
        zIndex: '1'
      }}>☕</div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: '10', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-block',
            background: 'white',
            borderRadius: '24px',
            padding: '32px 48px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '4px solid #78350f'
          }}>
            <h1 style={{
              fontSize: '64px',
              fontWeight: '900',
              color: '#78350f',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px'
            }}>
              ☕ {t("BOBA MENU")} 🧋
            </h1>
            <p style={{
              fontSize: '24px',
              color: '#92400e',
              fontWeight: '600',
              fontStyle: 'italic',
              margin: '0'
            }}>
              ━━━ {t("Handcrafted Daily")} ━━━
            </p>
          </div>

          {/* Search */}
          <div style={{ maxWidth: '500px', margin: '32px auto 0' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search drinks...")}
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: '18px',
                background: 'white',
                border: '3px solid #78350f',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* No Results */}
        {categories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <span style={{ fontSize: '96px', display: 'block', marginBottom: '24px' }}>😔</span>
            <p style={{ fontSize: '36px', fontWeight: '700', color: '#374151', margin: '0' }}>
              {t("No items found")}
            </p>
          </div>
        ) : (
          /* HORIZONTAL CATEGORIES */
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '32px',
              overflowX: 'auto',
              padding: '0 20px 32px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#78350f #fef3c7'
            }}>
              {categories.map((category) => {
                const items = groupedItems[category];

                return (
                  <div
                    key={category}
                    style={{
                      flexShrink: '0',
                      width: '400px',
                      background: 'white',
                      borderRadius: '24px',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                      border: '4px solid #78350f',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Category Header */}
                    <div style={{
                      background: 'linear-gradient(to right, #78350f, #92400e)',
                      color: 'white',
                      padding: '24px 32px',
                      textAlign: 'center'
                    }}>
                      <h2 style={{
                        fontSize: '36px',
                        fontWeight: '900',
                        margin: '0',
                        letterSpacing: '1px'
                      }}>
                        {category}
                      </h2>
                    </div>

                    {/* Menu Items */}
                    <div style={{ padding: '32px' }}>
                      {items.map((item, idx) => (
                        <div 
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            paddingBottom: '20px',
                            marginBottom: '20px',
                            borderBottom: idx < items.length - 1 ? '2px dotted #fbbf24' : 'none'
                          }}
                        >
                          <span style={{
                            flex: '1',
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#1f2937'
                          }}>
                            {item.name}
                          </span>
                          <span style={{
                            fontSize: '24px',
                            fontWeight: '900',
                            color: '#78350f'
                          }}>
                            ${Number(item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scroll Hint */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <p style={{
                color: '#78350f',
                fontWeight: '600',
                fontSize: '18px',
                margin: '0',
                animation: 'pulse 2s infinite'
              }}>
                ← Scroll to see more categories →
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '64px',
          background: 'white',
          borderRadius: '24px',
          padding: '32px 48px',
          maxWidth: '800px',
          margin: '64px auto 0',
          border: '4px solid #78350f',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}>
          <p style={{
            fontSize: '36px',
            fontWeight: '900',
            color: '#78350f',
            margin: '0 0 8px 0'
          }}>
            ✨ {t("Thank You")} ✨
          </p>
          <p style={{
            fontSize: '18px',
            color: '#92400e',
            fontStyle: 'italic',
            fontWeight: '600',
            margin: '0'
          }}>
            {t("Made Fresh with Premium Ingredients")}
          </p>
        </div>
      </div>

      {/* Scrollbar Styles */}
      <style>{`
        div::-webkit-scrollbar {
          height: 12px;
        }
        div::-webkit-scrollbar-track {
          background: #fef3c7;
          border-radius: 10px;
        }
        div::-webkit-scrollbar-thumb {
          background: #78350f;
          border-radius: 10px;
          border: 2px solid #fef3c7;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #92400e;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}