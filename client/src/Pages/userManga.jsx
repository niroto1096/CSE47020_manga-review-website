import React, { useEffect, useState } from "react";
import { getAllManga } from "@/Api/mangaApi";
import { useNavigate } from "react-router-dom";

const IMAGE_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const UserManga = () => {
  const [search, setSearch] = useState("");
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchManga = async () => {
    try {
      setLoading(true);
      const res = await getAllManga(search);
      const list = res?.data?.manga || res?.data || [];
      setManga(list);
    } catch (error) {
      console.error("Failed to fetch manga:", error);
      setManga([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManga();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleNavigate = (id) => navigate(`/manga-detail/${id}`);

  const imgSrc = (m) =>
    !m?.image
      ? ""
      : String(m.image).startsWith("http")
      ? m.image
      : `${IMAGE_BASE}/${String(m.image).replace(/^\/+/, "")}`;

  return (
    <div className="min-h-screen mt-10 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Full-Width Banner Image */}
      <div className="relative w-full h-64">
        <img
          src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/265a5953-9b87-4cc1-b805-038b047df1ba/ddpxuvr-f17df44d-3190-4327-a1c5-c6729e29eb53.png/v1/fill/w_1024,h_265/header___kaguya_sama__love_is_war_by_luluchan696_ddpxuvr-fullview.png"
          alt="banner"
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50 pointer-events-none" />
      </div>

      {/* Search Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-xl">
          <input
            type="text"
            placeholder="Search by title, genre or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 px-4 rounded-lg border transition
                       bg-white text-gray-900 border-gray-300 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Manga Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 px-4 pb-16">
        {loading ? (
          <>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="rounded-md h-[260px] animate-pulse bg-gray-200 dark:bg-gray-800"
              />
            ))}
          </>
        ) : manga.length === 0 ? (
          <div className="col-span-full text-center text-gray-600 dark:text-gray-400 text-lg">
            No manga found.
          </div>
        ) : (
          manga.map((m) => (
            <div
              key={m._id || m.id}
              className="flex flex-col items-center p-3 rounded-md transition cursor-pointer
                         bg-gray-200 hover:bg-gray-300
                         dark:bg-gray-800 dark:hover:bg-gray-700"
              onClick={() => handleNavigate(m._id || m.id)}
            >
              <img
                src={imgSrc(m)}
                alt={m.title || "Manga"}
                className="rounded-md w-full h-[220px] object-cover mb-2 border border-gray-300 dark:border-gray-700"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <p className="text-xs text-blue-700 dark:text-blue-400 mb-1 hover:underline">
                + Add to list
              </p>
              <h3 className="text-center font-semibold text-sm line-clamp-2">
                {m.title}
              </h3>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserManga;
