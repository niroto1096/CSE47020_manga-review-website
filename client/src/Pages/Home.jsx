// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getAllManga, getReviewSummaryApi } from "@/Api/mangaApi";
import { useNavigate } from "react-router-dom";

const IMAGE_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const banners = [
  {
    id: 1,
    heading: "Discover Timeless Manga Adventures",
    subtext:
      "Read from a vast collection of top-rated stories around the world.",
    image:
      "https://pbs.twimg.com/media/GoFW54gWgAA-Ls0?format=jpg&name=4096x4096",
  },
  {
    id: 2,
    heading: "Escape into Epic Storytelling",
    subtext: "Every scroll brings a new world. Your journey starts here.",
    image: "https://ae01.alicdn.com/kf/S896d834dc635468d951625b09caaf4d6G.jpeg",
  },
  {
    id: 3,
    heading: "Unleash Your Imagination",
    subtext: "Thousands of manga, hand-picked for every reader.",
    image:
      "https://e0.pxfuel.com/wallpapers/608/352/desktop-wallpaper-solo-leveling-pc-solo-leveling-laptop.jpg",
  },
];

/* ---------- Recently Viewed helpers ---------- */
const RECENT_KEY = "recentManga";
function buildImg(img) {
  if (!img) return "";
  return img.startsWith("http")
    ? img
    : `${IMAGE_BASE}/${String(img).replace(/^\/+/, "")}`;
}
function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
/* --------------------------------------------- */

const Home = () => {
  const navigate = useNavigate();

  const [featured, setFeatured] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [featuredAvg, setFeaturedAvg] = useState({}); // { [id]: avgOutOf5 }
  const [recommendedAvg, setRecommendedAvg] = useState({}); // { [id]: avgOutOf5 }
  const [recent, setRecent] = useState(loadRecent());
  const [recentSummaries, setRecentSummaries] = useState({}); // { [id]: { average, count } }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllManga("");
        const list = res?.data?.manga || res?.data || [];

        // Featured on the sidebar
        const featuredList = list.filter((m) => m.featured === true);
        setFeatured(featuredList);

        // Recommended: Top 5 by highest average review (out of 5)
        try {
          const ids = list.map((m) => String(m._id || m.id)).filter(Boolean);
          const entries = await Promise.all(
            ids.map(async (id) => {
              try {
                const { data } = await getReviewSummaryApi(id);
                return [id, Number(data?.average ?? 0)];
              } catch {
                return [id, 0];
              }
            })
          );
          const avgMap = Object.fromEntries(entries);
          // Set featured averages
          const featuredIds = featuredList.map((m) => String(m._id || m.id));
          const featuredAvgMap = Object.fromEntries(
            featuredIds.map((id) => [id, avgMap[id] ?? 0])
          );
          setFeaturedAvg(featuredAvgMap);
          // Set recommended averages and sort
          const sorted = [...list].sort(
            (a, b) => (avgMap[String(b._id || b.id)] || 0) - (avgMap[String(a._id || a.id)] || 0)
          );
          setRecommended(sorted.slice(0, 5));
          setRecommendedAvg(avgMap);
        } catch {
          // Fallback to previous 10-point rating if summary fails
          const top5 = [...list]
            .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
            .slice(0, 5);
          setRecommended(top5);
          // derive a fallback avg map from /10 rating converted to /5
          const fallbackMap = Object.fromEntries(
            list.map((m) => [String(m._id || m.id), Number(m.rating || 0) / 2])
          );
          setRecommendedAvg(fallbackMap);
          // Set featured fallback averages
          const featuredIds = featuredList.map((m) => String(m._id || m.id));
          const featuredFallbackMap = Object.fromEntries(
            featuredIds.map((id) => [id, fallbackMap[id] ?? 0])
          );
          setFeaturedAvg(featuredFallbackMap);
        }
      } catch (err) {
        console.error("Failed to fetch manga:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Refresh "recent" when coming back to the tab or if another tab updates it
  useEffect(() => {
    const fetchSummariesForRecent = async (items) => {
      try {
        const ids = Array.from(new Set(items.map((i) => String(i.id))));
        const entries = await Promise.all(
          ids.map(async (id) => {
            try {
              const { data } = await getReviewSummaryApi(id);
              return [id, { average: Number(data?.average ?? 0), count: Number(data?.count ?? 0) }];
            } catch {
              return [id, { average: 0, count: 0 }];
            }
          })
        );
        setRecentSummaries((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      } catch {
        /* ignore */
      }
    };

    const onFocus = () => {
      const items = loadRecent();
      setRecent(items);
      fetchSummariesForRecent(items);
    };
    const onStorage = (e) => {
      if (e.key === RECENT_KEY) setRecent(loadRecent());
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Fetch summaries on first mount or when recent changes (debounced by ids)
  useEffect(() => {
    const ids = recent.map((i) => String(i.id));
    if (ids.length === 0) return;
    (async () => {
      try {
        const entries = await Promise.all(
          Array.from(new Set(ids)).map(async (id) => {
            if (recentSummaries[id]) return [id, recentSummaries[id]];
            try {
              const { data } = await getReviewSummaryApi(id);
              return [id, { average: Number(data?.average ?? 0), count: Number(data?.count ?? 0) }];
            } catch {
              return [id, { average: 0, count: 0 }];
            }
          })
        );
        setRecentSummaries((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      } catch {
        /* ignore */
      }
    })();
  }, [recent]);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
  };

  const handleNavigate = (id) => {
    navigate(`/manga-detail/${id}`);
  };

  // Small horizontal card (Featured)
  const Card = ({ m }) => (
    <div
      key={m._id || m.id}
      className="flex overflow-hidden cursor-pointer transition shadow-lg rounded
                 bg-gray-200 hover:bg-gray-300
                 dark:bg-gray-800 dark:hover:bg-gray-700"
      onClick={() => handleNavigate(m._id || m.id)}
    >
      <img
        src={`${IMAGE_BASE}/${m.image}`}
        alt={m.title}
        className="w-24 h-24 object-cover"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <div className="p-4">
        <h3 className="text-base font-bold leading-tight line-clamp-2">
          {m.title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {m.author || "Unknown"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {(() => {
            const avg = featuredAvg[String(m._id || m.id)] ?? ((Number(m.rating ?? 0) || 0) / 2);
            return `⭐ ${Number(avg).toFixed(2)}/5`;
          })()}
        </p>
      </div>
    </div>
  );

  // Bigger vertical card (Recommended)
  const BigCard = ({ m }) => (
    <div
      key={m._id || m.id}
      className="rounded-lg shadow-lg overflow-hidden cursor-pointer transition
                 bg-gray-200 hover:bg-gray-300
                 dark:bg-gray-800 dark:hover:bg-gray-700"
      onClick={() => handleNavigate(m._id || m.id)}
    >
      <img
        src={`${IMAGE_BASE}/${m.image}`}
        alt={m.title}
        className="w-full h-60 object-cover"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <div className="p-4">
        <h3 className="text-lg font-bold leading-tight line-clamp-2">
          {m.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {m.author || "Unknown"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {(() => {
            const avg = recommendedAvg[String(m._id || m.id)] ?? ((Number(m.rating ?? 0) || 0) / 2);
            return `⭐ ${Number(avg).toFixed(2)}/5`;
          })()}
        </p>
      </div>
    </div>
  );
  // Bigger tile for Recently Viewed
  const RecentTile = ({ item }) => (
    <div
      onClick={() => handleNavigate(item.id)}
      className="min-w-[220px] max-w-[220px] shrink-0 rounded-lg border overflow-hidden
               cursor-pointer transition hover:shadow-lg
               border-gray-200 dark:border-gray-800 bg-gray-200 dark:bg-gray-800"
      title={item.title}
    >
      <img
        src={buildImg(item.image)}
        alt={item.title}
        className="w-full h-60 object-cover"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <div className="p-3">
        <div className="text-base font-semibold line-clamp-2">{item.title}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {(() => {
            const s = recentSummaries[String(item.id)] || { average: 0, count: 0 };
            return `⭐ ${Number(s.average || 0).toFixed(2)}/5 (${s.count})`;
          })()}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="w-full min-h-screen pt-24 px-4 overflow-hidden
                 bg-white text-gray-900
                 dark:bg-gray-950 dark:text-gray-100"
    >
      {/* Top: Slider + Featured Sidebar */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        {/* Left: Hero Slider */}
        <div className="md:w-2/3">
          <Slider {...sliderSettings}>
            {banners.map((b) => (
              <div
                key={b.id}
                className="relative h-full rounded-lg overflow-hidden"
              >
                <img
                  src={b.image}
                  alt={b.heading}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-start px-10">
                  <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight max-w-2xl text-white">
                    {b.heading}
                  </h2>
                  <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-xl">
                    {b.subtext}
                  </p>
                  <button
                    onClick={() => navigate("/all-manga")}
                    className="font-semibold px-6 py-2 rounded transition duration-300
                               bg-[#203771] text-white hover:opacity-90
                               dark:bg-[#203771] dark:text-white"
                  >
                    Browse All
                  </button>
                </div>
              </div>
            ))}
          </Slider>
        </div>

        {/* Right: Featured */}
        <div className="md:w-1/3 space-y-3 overflow-y-auto max-h-[500px] pr-1">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Featured
          </h2>
          {loading ? (
            <div className="space-y-3">
              <div className="h-24 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
              <div className="h-24 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            </div>
          ) : featured.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No featured manga.
            </p>
          ) : (
            <div className="space-y-3">
              {featured.map((m) => (
                <Card key={m._id || m.id} m={m} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Section below slider */}
      <div className="mt-10 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Recommended • Top 5</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="h-80 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="h-80 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            <div className="h-80 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
          </div>
        ) : recommended.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No recommendations yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {recommended.map((m) => (
              <BigCard key={`rec-${m._id || m.id}`} m={m} />
            ))}
          </div>
        )}
      </div>

      {/* Recently Viewed (from localStorage) */}
      {recent.length > 0 && (
        <div className="mt-10 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Recently Viewed</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recent.map((item) => (
              <RecentTile key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
