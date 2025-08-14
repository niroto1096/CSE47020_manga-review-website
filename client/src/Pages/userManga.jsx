import React, { useEffect, useState } from 'react';
import { getAllManga } from '@/Api/mangaApi';
import { useNavigate } from 'react-router-dom';

const UserManga = () => {
  const [search, setSearch] = useState('');
  const [manga, setManga] = useState([]);
  const navigate = useNavigate();

  const fetchManga = async () => {
    try {
      const res = await getAllManga(search);
      setManga(res.data || []);
    } catch (error) {
      console.error('Failed to fetch manga:', error);
    }
  };

  useEffect(() => {
    fetchManga();
  }, [search]);

  const handleNavigate = (id) => {
    navigate(`/manga-detail/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white mt-10">
      {/* Full-Width Banner Image */}
      <img
        src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/265a5953-9b87-4cc1-b805-038b047df1ba/ddpxuvr-f17df44d-3190-4327-a1c5-c6729e29eb53.png/v1/fill/w_1024,h_265/header___kaguya_sama__love_is_war_by_luluchan696_ddpxuvr-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzI2NWE1OTUzLTliODctNGNjMS1iODA1LTAzOGIwNDdkZjFiYVwvZGRweHV2ci1mMTdkZjQ0ZC0zMTkwLTQzMjctYTFjNS1jNjcyOWUyOWViNTMucG5nIiwiaGVpZ2h0IjoiPD0yNjUiLCJ3aWR0aCI6Ijw9MTAyNCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS53YXRlcm1hcmsiXSwid21rIjp7InBhdGgiOiJcL3dtXC8yNjVhNTk1My05Yjg3LTRjYzEtYjgwNS0wMzhiMDQ3ZGYxYmFcL2x1bHVjaGFuNjk2LTQucG5nIiwib3BhY2l0eSI6OTUsInByb3BvcnRpb25zIjowLjQ1LCJncmF2aXR5IjoiY2VudGVyIn19.DZgjx_DfprxdSkRdHQi5sw-s6W1FCWb2aYX9DtfbZLI"
        alt="banner"
        className="w-full h-64 object-cover"
      />

    
      {/* Search Section */}
<div className="max-w-4xl mx-32 py-12  sm:px-6 lg:px-8">
  <div className="max-w-md">
    <input
      type="text"
      placeholder="Search by title, genre or author..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full py-2 px-4 border border-gray-600 bg-gray-800 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</div>


      {/* Manga Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 px-4 pb-16">

        {manga.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 text-lg">
            No manga found.
          </div>
        ) : (
          manga.map((manga) => (
            <div
              key={manga._id}
              className="text-white flex flex-col items-center p-4 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => handleNavigate(manga._id)}
            >
              <img
                src={`http://localhost:8000/${manga.image}`}
                alt={manga.title}
                className="rounded-md w-full h-[220px] object-cover mb-2"
              />
              <p className="text-xs text-blue-400 mb-1 hover:underline">+ Add to list</p>
              <h3 className="text-center font-semibold text-sm">{manga.title}</h3>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserManga;
