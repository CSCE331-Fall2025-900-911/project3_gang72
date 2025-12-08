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

  // Group items by category for menu board sections
  const groupedItems = useMemo(() => {
    const groups = {};
    filtered.forEach((item) => {
      const cat = item.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filtered]);

  if (loading) {
    return (
      <div className="main-content">
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mb-4"></div>
            <p className="text-amber-300 text-lg font-medium">{t("Loading menu board...")} 📜</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="min-h-screen bg-slate-900 text-amber-100 relative">
        {/* Chalkboard texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`
        }}></div>

        {/* Decorative border like a frame */}
        <div className="absolute inset-4 border-8 border-amber-700/40 pointer-events-none rounded-lg"></div>
        <div className="absolute inset-6 border-2 border-amber-600/30 pointer-events-none rounded-lg"></div>

        {/* Header with search and filters */}
        <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b-4 border-amber-700/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Main Title */}
            <div className="text-center mb-6">
              <h1 className="text-6xl font-bold text-amber-300 mb-2" style={{ 
                fontFamily: 'serif',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}>
                ✨ {t("Boba Menu")} ✨
              </h1>
              <p className="text-xl text-amber-200/80 italic">{t("Handcrafted with Love")}</p>
            </div>

            {/* Category filters */}
            <div className="flex gap-3 justify-center flex-wrap mb-4">
              {categories.map((cat) => {
                const isActive = active === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActive(cat)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all text-sm uppercase tracking-wider
                    ${isActive
                        ? 'bg-amber-500 text-slate-900 shadow-lg scale-105 border-2 border-amber-300'
                        : 'bg-slate-800 text-amber-200 hover:bg-slate-700 border border-amber-700/50'
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="max-w-xl mx-auto">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="🔍 Search drinks..."
                className="w-full px-6 py-3 bg-slate-800 border-2 border-amber-700/50 rounded-lg text-amber-100 placeholder-amber-400/60 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>
        </header>

        {/* Menu Board Content */}
        <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-20">
              <span className="text-8xl mb-4 block">😔</span>
              <p className="text-amber-300 text-2xl font-bold">{t("No items found")}</p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="bg-slate-800/50 rounded-2xl p-8 border-4 border-amber-700/40 shadow-2xl">
                  {/* Category Header with decorative elements */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
                    <h2 className="mx-6 text-4xl font-bold text-amber-300 uppercase tracking-wider" style={{ fontFamily: 'serif' }}>
                      {category}
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent"></div>
                  </div>

                  {/* Menu Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items.map((item) => {
                      const itemImage = getDrinkImage(item.name);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-6 p-4 bg-slate-900/50 rounded-xl border-2 border-amber-700/30 hover:border-amber-500/50 hover:bg-slate-800/70 transition-all group"
                        >
                          {/* Image */}
                          <div className="flex-shrink-0">
                            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-amber-600/50 shadow-lg group-hover:scale-105 transition-transform">
                              <img
                                src={itemImage}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = DRINK_IMAGES.default;
                                }}
                              />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-2xl font-bold text-amber-200 mb-1 truncate" style={{ fontFamily: 'serif' }}>
                              {item.name}
                            </h3>
                            <div className="flex items-baseline gap-4">
                              <span className="text-amber-400/70 text-sm uppercase tracking-wider">
                                {item.category}
                              </span>
                            </div>
                          </div>

                          {/* Price - styled like handwritten */}
                          <div className="flex-shrink-0 text-right">
                            <div className="inline-block bg-amber-500/20 border-2 border-amber-500/50 rounded-lg px-4 py-2">
                              <span className="text-3xl font-bold text-amber-300" style={{ fontFamily: 'serif' }}>
                                ${Number(item.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Decorative dots between sections */}
                  <div className="flex justify-center gap-2 mt-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-amber-600/40"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-12 text-center border-t-4 border-amber-700/50 mt-12">
          <div className="text-amber-300/80">
            <p className="text-2xl font-bold mb-2" style={{ fontFamily: 'serif' }}>
              ✨ {t("Thank You!")} ✨
            </p>
            <p className="text-lg italic">{t("Made fresh daily with premium ingredients")}</p>
          </div>
        </footer>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  );
}