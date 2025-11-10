import { useEffect, useState, useMemo } from "react";

const ALL = "All";

const CAT_COLORS = {
  [ALL]: "from-amber-400 via-yellow-300 to-orange-400",
  "Milk Tea": "from-pink-300 via-rose-300 to-pink-400",
  "Coffee": "from-amber-300 via-orange-300 to-amber-400",
  "Tea Latte": "from-green-300 via-emerald-300 to-teal-300",
  "Slush Series": "from-cyan-300 via-sky-300 to-blue-300",
  "Slush": "from-indigo-300 via-purple-300 to-violet-300",
  "Toppings": "from-fuchsia-300 via-pink-300 to-rose-300",
};

const CARD_GRADIENTS = [
  "from-yellow-100 via-amber-50 to-orange-100",
  "from-rose-100 via-pink-50 to-fuchsia-100",
  "from-cyan-100 via-sky-50 to-blue-100",
  "from-green-100 via-emerald-50 to-teal-100",
  "from-purple-100 via-violet-50 to-indigo-100",
  "from-orange-100 via-red-50 to-pink-100",
];

export default function Menu() {
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
          <p className="text-amber-700 text-lg font-medium">Loading sunshine menu... ☀️</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 text-amber-900 font-sans relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-white/70 border-b border-amber-200/50 shadow-lg">
        <div className="relative max-w-7xl mx-auto px-6 py-6">
          {/* Logo and Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-amber-100 to-orange-100 p-4 rounded-full shadow-2xl border-4 border-white">
                <span className="text-6xl">🌞</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm mb-2">
              Sunshine Boba Menu
            </h1>
            <p className="text-amber-700/80 text-lg">☀️ Sip the sunshine, taste the joy! 🧋</p>
          </div>

          {/* Category Pills */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide justify-center flex-wrap">
            {categories.map((cat) => {
              const gradient = CAT_COLORS[cat] || CAT_COLORS[ALL];
              const isActive = active === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 transform hover:scale-105 border-2
                    ${
                      isActive
                        ? `bg-gradient-to-r ${gradient} text-white shadow-lg border-transparent scale-105`
                        : "bg-white/90 text-amber-700 hover:bg-amber-50 border-amber-200/50 shadow-md"
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
              className="w-full rounded-full border-2 border-amber-200/50 bg-white/90 px-6 py-3 text-base focus:outline-none focus:ring-4 focus:ring-amber-300/50 focus:border-amber-400 shadow-lg transition-all"
            />
          </div>
        </div>
      </header>

      {/* Menu Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">😢</span>
            <p className="text-amber-700 text-xl">No items found</p>
            <p className="text-amber-600 mt-2">Try a different search or category!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filtered.map((item, i) => {
              const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
              return (
                <div
                  key={item.id}
                  className={`group bg-gradient-to-br ${gradient} rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2 border-white/50 overflow-hidden backdrop-blur-sm`}
                >
                  {/* Image Container */}
                  <div className="relative h-32 bg-white/40 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/20"></div>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-24 object-cover rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80";
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-4 text-center">
                    <h3 className="text-sm font-bold text-amber-900 leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">
                      {item.name}
                    </h3>
                    <p className="text-xs text-amber-700/70 mb-2">{item.category}</p>
                    <div className="bg-white/60 rounded-full px-4 py-1.5 inline-block shadow-sm">
                      <p className="text-base font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
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
      <footer className="py-10 text-center text-amber-700/70 text-sm relative z-10 border-t border-amber-200/30 backdrop-blur-sm bg-white/30">
        <p className="mb-2">🌤️ Soak in sunshine & sip the sweetness 💛</p>
        <p className="text-xs">Made with love and sunshine ☀️</p>
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
  );
}
