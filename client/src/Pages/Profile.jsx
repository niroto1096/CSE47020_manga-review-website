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
  const [loading, setLoading] = useState(true);

  // fetch both lists
  useEffect(() => {
    (async () => {
      try {
        if (userId) {
          const res = await getMyPersonalList(userId, 1, 20);
          const list = res?.data?.data || res?.data?.items || res?.data || [];
          setPersonalList(list);
        }

        const resM = await getAllManga("");
        const mangas = resM?.data?.manga || resM?.data || [];
        const feats = mangas.filter((m) => m.featured === true);
        setFeatured(feats);
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const Card = ({ m, status }) => (
    <div
      key={m._id || m.id}
      className="flex bg-gray-800 rounded shadow hover:bg-gray-700 cursor-pointer transition"
      onClick={() => navigate(`/manga-detail/${m._id || m.id}`)}
    >
      <img
        src={`${IMAGE_BASE}/${m.image}`}
        alt={m.title}
        className="w-24 h-24 object-cover rounded-l"
      />
      <div className="p-3">
        <h3 className="text-sm font-semibold">{m.title}</h3>
        <p className="text-xs text-gray-400">{m.author || "Unknown"}</p>
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
        {/* Avatar image */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalList.map((entry) => (
                  <Card key={entry._id} m={entry.manga} status={entry.status} />
                ))}
              </div>
            )}
          </section>

          {/* Featured Comics */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">⭐ Featured Comics</h2>
            {featured.length === 0 ? (
              <p className="text-gray-400">No featured comics available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((m) => (
                  <Card key={`feat-${m._id || m.id}`} m={m} />
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