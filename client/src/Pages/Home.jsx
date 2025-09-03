import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getAllManga } from "@/Api/mangaApi";
import { useNavigate } from "react-router-dom";

const banners = [
  {
    id: 1,
    heading: "Discover Timeless Manga Adventures",
    subtext:
      "Read from a vast collection of top-rated stories around the world.",
    image:
      "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/cc04221c-9aea-41f1-9f43-5733e880b205/dg2qfjb-dad36763-4d94-42de-aefb-bb7c609a8089.png/v1/fill/w_1280,h_720,q_80,strp/banner_anime___gojo_satoru_by_skurtdzn_dg2qfjb-fullview.jpg",
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

const Home = () => {
  const navigate = useNavigate();

  const [allManga, setAllManga] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllManga("");
        const list = res?.data?.manga || res?.data || [];
        setAllManga(list);

        setFeatured(list.filter((m) => m.featured === true));

        const top5 = [...list]
          .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
          .slice(0, 5);
        setRecommended(top5);
      } catch (err) {
        console.error("Failed to fetch manga:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const Card = ({ m }) => (
    <div
      key={m._id || m.id}
      className="flex bg-gray-800 shadow-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition"
      onClick={() => handleNavigate(m._id || m.id)}
    >
      <img
        src={`http://localhost:8000/${m.image}`}
        alt={m.title}
        className="w-24 h-24 object-cover"
      />
      <div className="p-4">
        <h3 className="text-base font-bold leading-tight line-clamp-2">
          {m.title}
        </h3>
        <p className="text-xs text-gray-300">{m.author || "Unknown"}</p>
        <p className="text-xs text-gray-400 mt-1">⭐ {m.rating ?? 0}/10</p>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white pt-24 px-4 overflow-hidden">
      {/* Top Layout: Slider + Sidebar */}
      <div className="flex flex-col md:flex-row gap-8">
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
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-start px-10">
                  <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight max-w-2xl">
                    {b.heading}
                  </h2>
                  <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-xl">
                    {b.subtext}
                  </p>
                  <button
                    onClick={() => navigate("/manga")}
                    className="bg-[#203771] text-white font-semibold px-6 py-2 rounded hover:bg-gray-200 hover:text-black transition duration-300"
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
          <h2 className="text-lg font-semibold mb-2">Featured</h2>
          {loading ? (
            <div className="space-y-3">
              <div className="h-24 bg-gray-800 animate-pulse rounded" />
              <div className="h-24 bg-gray-800 animate-pulse rounded" />
            </div>
          ) : featured.length === 0 ? (
            <p className="text-sm text-gray-400">No featured manga.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-800 animate-pulse rounded" />
            <div className="h-32 bg-gray-800 animate-pulse rounded" />
            <div className="h-32 bg-gray-800 animate-pulse rounded" />
          </div>
        ) : recommended.length === 0 ? (
          <p className="text-gray-400">No recommendations yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((m) => (
              <Card key={`rec-${m._id || m.id}`} m={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
