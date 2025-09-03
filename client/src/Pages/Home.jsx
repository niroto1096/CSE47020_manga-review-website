import React from "react";
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
      "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/cc04221c-9aea-41f1-9f43-5733e880b205/dg2qfjb-dad36763-4d94-42de-aefb-bb7c609a8089.png/v1/fill/w_1280,h_720,q_80,strp/banner_anime___gojo_satoru_by_skurtdzn_dg2qfjb-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NzIwIiwicGF0aCI6IlwvZlwvY2MwNDIyMWMtOWFlYS00MWYxLTlmNDMtNTczM2U4ODBiMjA1XC9kZzJxZmpiLWRhZDM2NzYzLTRkOTQtNDJkZS1hZWZiLWJiN2M2MDlhODA4OS5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.gSU2oyexqUKW-7iTDC_A48zuB-FMKVzSwbQOoBU-3OA",
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

let manga = [];
try {
  const res = await getAllManga("");

  // If your backend returns an array directly:
  manga = (res.data || []).filter((m) => m.featured === true);

  console.log("Featured Manga:", manga);
} catch (error) {
  console.error("Failed to fetch manga:", error);
}

const Home = () => {
  const navigate = useNavigate();
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

  return (
    <div className="w-full h-screen bg-gray-900 text-white pt-24 px-4 overflow-hidden">
      <div className="flex flex-col md:flex-row gap-8 h-[calc(100vh-80px)]">
        {/* Left: Hero Slider */}
        <div className="md:w-2/3 h-full">
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
                  <button className="bg-[#203771] text-white font-semibold px-6 py-2 rounded hover:bg-gray-200 transition duration-300">
                    Browse All
                  </button>
                </div>
              </div>
            ))}
          </Slider>
          <div className="bg-[#203771] w-full h-44 flex items-center justify-center text-center px-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome to MangaVerse
              </h1>
              <p className="text-white text-lg">
                Dive into a world of adventure, fantasy, and epic storytelling.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Manga Cards */}

        <div className="md:w-1/3 space-y-3 overflow-y-auto max-h-full">
          <h1>Featured</h1>
          {manga.map((m) => (
            <div
              key={m.id}
              className="flex bg-gray-800  shadow-lg overflow-hidden"
              onClick={() => handleNavigate(m._id)}
            >
              <img
                src={`http://localhost:8000/${m.image}`}
                alt={m.title}
                className="w-24 h-24 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold">{m.title}</h3>
                <p className="text-sm ">{m.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;