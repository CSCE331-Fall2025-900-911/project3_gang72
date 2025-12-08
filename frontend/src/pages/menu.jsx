import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

const ALL = "All";

// Simplified colors for a chalkboard/wood menu board look
const CAT_COLORS = {
  [ALL]: "text-white bg-green-700 hover:bg-green-600 border-2 border-green-300",
  "Milk Tea": "text-green-900 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300",
  "Coffee": "text-green-900 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300",
  "Tea Latte": "text-green-900 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300",
  "Slush Series": "text-green-900 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300",
  "Slush": "text-green-900 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300",
  "Toppings": "text-green-900 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300",
};

export default function MenuBoard() {
  const { t } = useLanguage();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(ALL);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // This UI accesses the backend to fetch menu items
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

  // Backtracking logic to determine categories required
  const categories = useMemo(
    () => [ALL, ...new Set(menuItems.map((i) => i.category).filter(Boolean))],
    [menuItems]
  );

  // Filter items based on active category and search query
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
    // Loading state with a simple, pleasant animation
    return (
      <div className="main-content">
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mb-4"></div>
            <p className="text-amber-400 text-lg font-medium">Loading menu board... 📜</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    // The main-content wrapper ensures the page is centered relative to the navbar
    <div className="main-content">
      <div className="min-h-screen bg-gray-900 text-amber-200 font-serif relative overflow-hidden">
        
        {/* Decorative Chalk Border Effect */}
        <div className="absolute inset-0 border-[20px] border-amber-700/50 pointer-events-none z-0"></div>

        {/* Header - Menu Board Sign/Title */}
        <header className="sticky top-0 z-30 bg-gray-900 shadow-2xl border-b-4 border-amber-700">
          <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-4">
            {/* Title Block */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-amber-600 text-gray-900 px-8 py-4 rounded-2xl shadow-xl border-4 border-amber-700 transform rotate-1">
                <h1 className="text-5xl font-extrabold drop-shadow-md mb-1 uppercase tracking-wider">
                  {t("Boba Menu Board")}
                </h1>
                <p className="text-lg font-medium opacity-90">{t("Freshly Made For You!")}</p>
              </div>
            </div>

            {/* Category Buttons - Clean and High Contrast */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide justify-center flex-wrap">
              {categories.map((cat) => {
                const isActive = active === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActive(cat)}
                    className={`whitespace-nowrap rounded-lg px-6 py-2 text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg
                    ${isActive
                        ? CAT_COLORS[ALL] // Highlight active button with high contrast
                        : "text-amber-200 bg-gray-700 hover:bg-gray-600 border border-gray-500"
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Bar - Chalkboard Style */}
            <div className="relative max-w-lg mx-auto mb-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="🔍 Search drink name..."
                className="w-full rounded-lg border-2 border-amber-400 bg-gray-800 px-6 py-3 text-base text-amber-100 placeholder-amber-400/70 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-inner transition-all font-medium"
              />
            </div>
          </div>
        </header>

        {/* Menu Items - Grid Layout for Menu Board Look */}
        <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-gray-800/50 rounded-lg border border-amber-700">
              <span className="text-8xl mb-4 block">😔</span>
              <p className="text-amber-400 text-2xl font-bold">No items match your search</p>
              <p className="text-amber-300 mt-2 text-lg">Try a different filter or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                // Menu Item Card - Simple and Clean
                <div
                  key={item.id}
                  className="bg-gray-800 rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-700/80 transition-all duration-300 border-2 border-amber-700/70 p-5 transform hover:-translate-y-1"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0 mr-4">
                      {/* Item Name - Bold and Clear */}
                      <h3 className="text-xl font-extrabold text-amber-200 mb-1 leading-snug truncate">
                        {item.name}
                      </h3>
                      {/* Category - Subtle Tag */}
                      <p className="text-sm text-green-400 font-semibold uppercase tracking-wider">
                        {item.category}
                      </p>
                    </div>
                    {/* Price - Highlighted */}
                    <div className="flex-shrink-0 bg-green-500 text-gray-900 rounded-full px-4 py-2 shadow-md border border-green-700">
                      <p className="text-xl font-bold">
                        ${Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Footer - Final Menu Board Element */}
        <footer className="py-8 text-center text-amber-400 text-lg relative z-10 border-t-4 border-amber-700/70 bg-gray-900/50 mt-12">
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-2xl font-bold mb-2 tracking-wide">
              {t("Thank You! Have a Lovely Day!")} 🌸
            </p>
            <p className="text-sm italic opacity-80">
              {t("Ask an employee about our daily specials.")}
            </p>
          </div>
        </footer>

        {/* Custom CSS for hidden scrollbar and fonts */}
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