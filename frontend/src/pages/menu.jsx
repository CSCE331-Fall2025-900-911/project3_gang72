import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function MenuBoard() {
  const { t } = useLanguage();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-gray-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="main-content menu-board">
      <div className="min-h-screen bg-white text-gray-900 px-10 py-8">

        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-6xl font-bold flex items-center justify-center gap-4">
            ☕ {t("BOBA MENU")} 🧋
          </h1>
          <p className="text-xl text-gray-600 mt-2 italic">
            ─── {t("Handcrafted Daily")} ───
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto mt-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Search drinks...")}
              className="w-full px-5 py-2.5 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>
        </header>

        {/* No results */}
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-7xl block mb-4">😔</span>
            <p className="text-2xl font-bold">{t("No items found")}</p>
          </div>
        ) : (
          // ⭐⭐⭐ TRUE HORIZONTAL MENU BOARD — NEVER STACKS ⭐⭐⭐
          <div
        className="flex flex-row gap-10 overflow-x-auto pb-6 whitespace-nowrap w-[200vw]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
            {categories.map((category) => {
              const items = groupedItems[category];

              return (
                <div
                  key={category}
                  className="inline-block align-top min-w-[320px] bg-white rounded-xl p-6 border border-gray-300 shadow-sm"
                >
                  {/* Category Title */}
                  <h2 className="text-3xl font-bold text-center mb-6">
                    {category}
                  </h2>

                  {/* Category Items */}
                  <div className="flex flex-col gap-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center">
                        <span className="text-lg">{item.name}</span>
                        <span className="flex-grow border-b border-dotted mx-3 border-gray-400"></span>
                        <span className="text-lg font-semibold">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16">
          <p className="text-xl font-bold">✨ {t("Thank You")} ✨</p>
          <p className="text-gray-500 mt-1 italic">
            {t("Made Fresh with Premium Ingredients")}
          </p>
        </footer>
      </div>

      {/* Remove all bullets */}
      <style>{`
        .menu-board * {
          list-style: none !important;
        }
      `}</style>
    </div>
  );
}
