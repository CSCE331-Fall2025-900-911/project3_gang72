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

  // Group items by category and filter by search
  const groupedItems = useMemo(() => {
    const filtered = searchQuery 
      ? menuItems.filter(item => 
          item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : menuItems;

    const groups = {};
    filtered.forEach((item) => {
      const cat = item.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [menuItems, searchQuery]);

  const categories = Object.keys(groupedItems);

  if (loading) {
    return (
      <div className="main-content">
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-amber-400 border-t-transparent mb-4"></div>
            <p className="text-amber-300 text-xl">{t("Loading Menu...")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="min-h-screen bg-slate-900 text-amber-100 relative overflow-auto">
        {/* Chalkboard texture overlay */}
        <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`
        }}></div>

        {/* Ornate decorative border */}
        <div className="fixed inset-4 border-8 border-double border-amber-600/50 pointer-events-none rounded-sm"></div>
        <div className="fixed inset-6 border-2 border-amber-500/30 pointer-events-none"></div>

        <div className="relative z-10 px-10 py-8">
          {/* Header */}
          <header className="text-center mb-8 pb-6 border-b-4 border-amber-600/60">
            <div className="flex items-center justify-center gap-6 mb-3">
              <div className="text-5xl">☕</div>
              <div>
                <h1 className="text-6xl md:text-7xl font-bold text-amber-200" style={{ 
                  fontFamily: 'Georgia, serif',
                  textShadow: '3px 3px 8px rgba(0,0,0,0.7)',
                  letterSpacing: '0.08em'
                }}>
                  {t("BOBA MENU")}
                </h1>
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="h-0.5 w-24 bg-amber-500/60"></div>
                  <p className="text-xl text-amber-300/90 italic tracking-wide">{t("Handcrafted Daily")}</p>
                  <div className="h-0.5 w-24 bg-amber-500/60"></div>
                </div>
              </div>
              <div className="text-5xl">🧋</div>
            </div>
            
            {/* Search bar */}
            <div className="max-w-md mx-auto mt-5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("🔍 Search drinks...")}
                className="w-full px-5 py-2.5 bg-slate-800/70 border-2 border-amber-700/50 rounded-lg text-amber-100 placeholder-amber-400/60 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 text-base"
              />
            </div>
          </header>

          {/* Main Menu Board - Categories side by side */}
          {categories.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-7xl mb-4 block">😔</span>
              <p className="text-amber-300 text-2xl font-bold">{t("No items found")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categories.map((category) => {
                const items = groupedItems[category];
                return (
                  <div 
                    key={category} 
                    className="bg-slate-800/40 rounded-xl p-6 border-3 border-amber-700/50 shadow-2xl hover:shadow-amber-900/20 transition-shadow"
                  >
                    {/* Category Header */}
                    <div className="mb-5 pb-4 border-b-2 border-amber-600/50 relative">
                      {/* Decorative corner elements */}
                      <div className="absolute -top-1 -left-1 text-amber-500/60 text-lg">◆</div>
                      <div className="absolute -top-1 -right-1 text-amber-500/60 text-lg">◆</div>
                      
                      <h2 
                        className="text-3xl font-bold text-amber-300 uppercase text-center py-2" 
                        style={{ 
                          fontFamily: 'Georgia, serif',
                          letterSpacing: '0.12em',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.6)'
                        }}
                      >
                        {category}
                      </h2>
                      
                      {/* Bottom decorative line */}
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-amber-500/40"></div>
                    </div>

                    {/* Items list - Name and price on same line */}
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="group hover:bg-slate-700/40 px-3 py-2 rounded-lg transition-all"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-lg text-amber-100 font-medium leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Decorative dots */}
                              <div className="flex-1 border-b-2 border-dotted border-amber-600/40 min-w-[16px] group-hover:border-amber-500/60 transition-colors"></div>
                              <span className="text-lg text-amber-400 font-bold tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
                                ${Number(item.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom decorative dots */}
                    <div className="flex justify-center gap-2 mt-5 pt-3 border-t border-amber-700/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600/50"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600/50"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600/50"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <footer className="text-center mt-10 pt-8 border-t-4 border-amber-600/60">
            <div className="flex items-center justify-center gap-5">
              <div className="h-0.5 w-32 bg-gradient-to-r from-transparent to-amber-600/50"></div>
              <div>
                <p className="text-2xl font-bold text-amber-300 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  ✨ {t("Thank You")} ✨
                </p>
                <p className="text-base text-amber-200/70 italic">{t("Made Fresh with Premium Ingredients")}</p>
              </div>
              <div className="h-0.5 w-32 bg-gradient-to-l from-transparent to-amber-600/50"></div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}