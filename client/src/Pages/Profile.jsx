import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllManga, getMyPersonalList } from "@/Api/mangaApi";

const IMAGE_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const Profile = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username") || "Guest";

  const [personalList, setPersonalList] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [reviewed, setReviewed] = useState([]); // NEW
  const [loading, setLoading] = useState(true);

  // helpers
  const isReviewedByUser = (m) => {
    if (!m) return false;
    // support either an array of userId strings in m.raters
    if (Array.isArray(m.raters) && userId) {
      if (m.raters.includes(userId)) return true;
      // sometimes ids are objects: { _id: "..." }
      if (m.raters.some((r) => (r?._id || r?.id) === userId)) return true;
    }
    // or an array of rating docs: { user: <id>, value: <num> }
    if (Array.isArray(m.ratings) && userId) {
      if (
        m.ratings.some(
          (r) => (r?.user?._id || r?.user?.id || r?.user) === userId
        )
      ) {
        return true;
      }
    }
    return false;
  };

  const imgSrc = (m) =>
    !m?.image
      ? ""
      : m.image.startsWith("http")
      ? m.image
      : `${IMAGE_BASE}/${m.image.replace(/^\/+/, "")}`;

  useEffect(() => {
    (async () => {
      try {
        if (userId) {
          const res = await getMyPersonalList(userId, 1, 20);
          const list = res?.data?.data || res?.data?.items || res?.data || [];
          // hide entries with status === 'unread' (case-insensitive)
          const cleaned = list.filter((e) => {
            const s = (e?.status || "").toString().trim().toLowerCase();
            return s !== "unread";
          });
          setPersonalList(cleaned);
        }

        const resM = await getAllManga("");
        const mangas = resM?.data?.manga || resM?.data || [];

        setFeatured(mangas.filter((m) => m.featured === true));

        const top5 = [...mangas]
          .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
          .slice(0, 5);
        setRecommended(top5);

        // NEW: reviewed by current user
        if (userId) {
          setReviewed(mangas.filter(isReviewedByUser));
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Big vertical card (for all sections)
  const BigCard = ({ m, status }) => (
    <div
      key={m?._id || m?.id}
      className="bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition"
      onClick={() => m && navigate(`/manga-detail/${m._id || m.id}`)}
    >
      <img
        src={imgSrc(m)}
        alt={m?.title || "Manga"}
        className="w-full h-60 object-cover"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <div className="p-4">
        <h3 className="text-lg font-bold leading-tight line-clamp-2">
          {m?.title || "Untitled"}
        </h3>
        <p className="text-sm text-gray-300">{m?.author || "Unknown"}</p>
        <p className="text-sm text-gray-400 mt-1">⭐ {m?.rating ?? 0}/10</p>
        {status && (
          <p className="mt-1 text-xs text-yellow-400">Status: {status}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white px-4 py-20">
      {/* Profile header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 mb-10">
        <img
          src="https://c8.alamy.com/comp/2PWERD5/student-avatar-illustration-simple-cartoon-user-portrait-user-profile-icon-youth-avatar-vector-illustration-2PWERD5.jpg"
          alt="Profile Avatar"
          className="w-28 h-28 rounded-full object-cover border-2 border-gray-600"
        />
        <div>
          <h1 className="text-3xl font-bold">{username}</h1>
          <p className="text-gray-400 text-sm">Joined: Jan 2025</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400">Loading...</p>
      ) : (
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Personal List */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">📚 My Personal List</h2>
            {personalList.length === 0 ? (
              <p className="text-gray-400">
                You don’t have anything in your list yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {personalList.map((entry) => (
                  <BigCard
                    key={entry._id}
                    m={entry.manga}
                    status={entry.status}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Reviewed (NEW) */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">📝 Reviewed by You</h2>
            {userId ? (
              reviewed.length === 0 ? (
                <p className="text-gray-400">
                  You haven’t reviewed any manga yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {reviewed.map((m) => (
                    <BigCard key={`rev-${m._id || m.id}`} m={m} />
                  ))}
                </div>
              )
            ) : (
              <p className="text-gray-400">Sign in to see your reviews.</p>
            )}
          </section>

          {/* Featured Comics */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">⭐ Featured Comics</h2>
            {featured.length === 0 ? (
              <p className="text-gray-400">No featured comics available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featured.map((m) => (
                  <BigCard key={`feat-${m._id || m.id}`} m={m} />
                ))}
              </div>
            )}
          </section>

          {/* Recommended Comics */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              🔥 Recommended • Top 5
            </h2>
            {recommended.length === 0 ? (
              <p className="text-gray-400">No recommendations available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommended.map((m) => (
                  <BigCard key={`rec-${m._id || m.id}`} m={m} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Profile;
