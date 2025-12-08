import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

const ALL = "All";

// Comprehensive image database with color-coded, specific drink images
const DRINK_IMAGES = {
  // Milk Tea variants - brown/beige tones
  "classic milk tea": "https://images.unsplash.com/photo-1558857563-b101ff2a6b34?w=200&q=80",
  "thai milk tea": "https://images.unsplash.com/photo-1556881286-fc6915169721?w=200&q=80",
  "brown sugar milk tea": "https://images.unsplash.com/photo-1578899952107-9d9d3f1e1c5f?w=200&q=80",
  "brown sugar": "https://images.unsplash.com/photo-1578899952107-9d9d3f1e1c5f?w=200&q=80",
  "milk tea": "https://images.unsplash.com/photo-1558857563-b101ff2a6b34?w=200&q=80",
  
  // Taro - PURPLE
  "taro": "https://images.unsplash.com/photo-1603349206295-dde20617cb6a?w=200&q=80",
  
  // Matcha - GREEN
  "matcha": "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200&q=80",
  "matcha latte": "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200&q=80",
  "green tea": "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200&q=80",
  
  // Honeydew - light green
  "honeydew": "https://images.unsplash.com/photo-1622597467836-f3c7ca9d2d8c?w=200&q=80",
  
  // Coffee variants - brown/dark
  "coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&q=80",
  "iced coffee": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=200&q=80",
  "vietnamese coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&q=80",
  "mocha": "https://images.unsplash.com/photo-1578374173713-231dfbd0d367?w=200&q=80",
  "caramel": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&q=80",
  "latte": "https://images.unsplash.com/photo-1534778101976-62847782c213?w=200&q=80",
  
  // Strawberry - PINK/RED
  "strawberry": "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&q=80",
  
  // Mango - ORANGE/YELLOW
  "mango": "https://images.unsplash.com/photo-1546173159-315724a31696?w=200&q=80",
  
  // Peach - ORANGE
  "peach": "https://images.unsplash.com/photo-1629828874514-d59cd4656eb4?w=200&q=80",
  
  // Watermelon - RED/PINK
  "watermelon": "https://images.unsplash.com/photo-1587049352846-4a222e784794?w=200&q=80",
  
  // Lychee - WHITE/PINK
  "lychee": "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=200&q=80",
  
  // Blue/Blueberry - BLUE
  "blue": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&q=80",
  "blueberry": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&q=80",
  "blue raspberry": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&q=80",
  
  // Passion Fruit - YELLOW
  "passion fruit": "https://images.unsplash.com/photo-1568158879083-c42860933ed7?w=200&q=80",
  "passion": "https://images.unsplash.com/photo-1568158879083-c42860933ed7?w=200&q=80",
  
  // Slush generic
  "slush": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&q=80",
  
  // Toppings - specific images
  "boba": "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=200&q=80",
  "tapioca pearl": "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=200&q=80",
  "pearl": "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=200&q=80",
  "jelly": "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=200&q=80",
  "pudding": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&q=80",
  "foam": "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&q=80",
  "cheese foam": "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&q=80",
  "popping": "https://images.unsplash.com/photo-1633945274309-a2c08b8e9862?w=200&q=80",
  "crystal": "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=200&q=80",
  
  // Default/fallback - generic boba drink
  "default": "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=200&q=80"
};

// Function to get image for a drink
const getDrinkImage = (name) => {
  const lowerName = name.toLowerCase();
  
  // Check for exact match first
  if (DRINK_IMAGES[lowerName]) {
    return DRINK_IMAGES[lowerName];
  }
  
  // Check for partial matches
  for (const [key, image] of Object.entries(DRINK_IMAGES)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return image;
    }
  }
  
  // Return default
  return DRINK_IMAGES.default;
};

// Category colors for the menu board theme
const CAT_COLORS = {
  [ALL]: "from-amber-400 via-yellow-300 to-orange-400",
  "Milk Tea": "from-pink-300 via-rose-300 to-pink-400",
  "Coffee": "from-amber-300 via-orange-300 to-amber-400",
  "Tea Latte": "from-green-300 via-emerald-300 to-teal-300",
  "Slush Series": "from-cyan-300 via-sky-300 to-blue-300",
  "Slush": "from-indigo-300 via-purple-300 to-violet-300",
  "Toppings": "from-fuchsia-300 via-pink-300 to-rose-300",
};

export default function MenuBoard() {
  const { t } = useLanguage();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(ALL);
  const [query, setQuery] = useState("");

  useEffect(() => {
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

  const categories = useMemo(
    () => [ALL, ...new Set(menuItems.map((i) => i.category).filter(Boolean))],
    [menuItems]
  );

  const filtered = useMemo(
    () =>
      menuItems.filter(
        (i) =>
          (active === ALL || i.category === active) &&
          (!query || i.name.toLowerCase().includes(query.toLowerCase()))
      ),
    [menuItems, active, query]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mb-4"></div>
          <p className="text-amber-700 text-lg font-medium">Loading menu... 🧋</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 text-amber-900 font-sans relative overflow-hidden">
      {/* Animated background bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header - Menu Board Style */}
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-gradient-to-r from-amber-100/90 via-orange-100/90 to-pink-100/90 border-b-4 border-amber-300 shadow-2xl">
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Menu Board Sign */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-white to-amber-50 p-6 rounded-3xl shadow-2xl border-4 border-amber-400">
                <span className="text-6xl">🧋</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-2xl shadow-xl border-4 border-amber-700 transform -rotate-1">
              <h1 className="text-4xl md:text-5xl font-bold drop-shadow-lg mb-1">
                ✨ {t("Boba Menu Board")} ✨
              </h1>
              <p className="text-lg font-medium opacity-90">{t("Fresh & Delicious Drinks!")}</p>
            </div>
          </div>

          {/* Category Buttons - Menu Board Style */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide justify-center flex-wrap">
            {categories.map((cat) => {
              const gradient = CAT_COLORS[cat] || CAT_COLORS[ALL];
              const isActive = active === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`whitespace-nowrap rounded-2xl px-8 py-3 text-base font-bold transition-all duration-300 transform hover:scale-110 border-3 shadow-lg
                  ${isActive
                      ? `bg-gradient-to-r ${gradient} text-white shadow-2xl border-white scale-110`
                      : "bg-white text-amber-700 hover:bg-amber-50 border-amber-300 shadow-md"
                    }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Search your favorite drink..."
              className="w-full rounded-2xl border-3 border-amber-300 bg-white px-6 py-4 text-base focus:outline-none focus:ring-4 focus:ring-orange-300 focus:border-orange-400 shadow-lg transition-all font-medium"
            />
          </div>
        </div>
      </header>

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-8xl mb-4 block">🔍</span>
            <p className="text-amber-700 text-2xl font-bold">No items found</p>
            <p className="text-amber-600 mt-2 text-lg">Try a different search or category!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filtered.map((item) => {
              const itemImage = getDrinkImage(item.name);
              return (
                <div
                  key={item.id}
                  className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 border-4 border-amber-200 overflow-hidden backdrop-blur-sm cursor-pointer transform hover:rotate-1"
                >
                  {/* Image Container */}
                  <div className="relative h-36 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30"></div>
                    <img
                      src={itemImage}
                      alt={item.name}
                      className="w-28 h-28 object-cover rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = DRINK_IMAGES.default;
                      }}
                    />
                    {/* Cute corner decoration */}
                    <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-1 shadow-lg">
                      <span className="text-lg">✨</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 text-center bg-gradient-to-b from-white to-amber-50">
                    <h3 className="text-sm font-bold text-amber-900 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                      {item.name}
                    </h3>
                    <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-full px-3 py-1 inline-block mb-2 border-2 border-amber-200">
                      <p className="text-xs text-amber-700 font-semibold">{item.category}</p>
                    </div>
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl px-4 py-2 inline-block shadow-lg border-2 border-amber-600">
                      <p className="text-lg font-bold">
                        ${Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 text-center text-amber-700 text-base relative z-10 border-t-4 border-amber-300 backdrop-blur-sm bg-gradient-to-r from-amber-100/50 to-orange-100/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-2xl font-bold mb-2">✨ {t("Made with Love & Bubbles")} ✨</p>
          <p className="text-lg">🧋 {t("Sip the sunshine, taste the joy!")} 💛</p>
        </div>
      </footer>

        <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      </div>
    </div>
  );
}