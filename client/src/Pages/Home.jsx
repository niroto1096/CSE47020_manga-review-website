import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const banners = [
  {
    id: 1,
    heading: "Discover Timeless Manga Adventures",
    subtext: "Read from a vast collection of top-rated stories around the world.",
    image: "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/cc04221c-9aea-41f1-9f43-5733e880b205/dg2qfjb-dad36763-4d94-42de-aefb-bb7c609a8089.png/v1/fill/w_1280,h_720,q_80,strp/banner_anime___gojo_satoru_by_skurtdzn_dg2qfjb-fullview.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NzIwIiwicGF0aCI6IlwvZlwvY2MwNDIyMWMtOWFlYS00MWYxLTlmNDMtNTczM2U4ODBiMjA1XC9kZzJxZmpiLWRhZDM2NzYzLTRkOTQtNDJkZS1hZWZiLWJiN2M2MDlhODA4OS5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.gSU2oyexqUKW-7iTDC_A48zuB-FMKVzSwbQOoBU-3OA",
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
    image: "https://e0.pxfuel.com/wallpapers/608/352/desktop-wallpaper-solo-leveling-pc-solo-leveling-laptop.jpg",
  },
];

const manga = [
  {
    id: 1,
    title: "JoJo’s Bizarre Adventure: Part 7--Steel Ball Run",
    author: "Hirohiko Araki",
    poster: "https://d28hgpri8am2if.cloudfront.net/book_images/onix/cvr9781974758890/jojos-bizarre-adventure-part-7-steel-ball-run-vol-4-9781974758890_xlg.jpg", // Replace with preferred image
  },
  {
    id: 2,
    title: "Sunny",
    author: "	Taiyō Matsumoto",
    poster: "https://dw9to29mmj727.cloudfront.net/promo/2016/5581-Tier07_Headers_Sunny_2000x800.jpg", // Replace with preferred image
  },
  {
    id: 3,
    title: "The Legend of the Strongest, Kurosawa!",
    author: "Nobuyuki Fukumoto",
    poster: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmU-0BbmXIjKHtWo3aZQtyLP-_sGmUS9w-1WPFJJdv9ZEG10BLa_4d5SmX5uurRcrmkpI&usqp=CAU", // Replace with preferred image
  },
  {
    id: 4,
    title: "The Climber",
    author: "Shin-ichi Sakamoto",
    poster: "data:image/jpeg;base64,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", // Replace with preferred image
  },
  {
    id: 5,
    title: "A Cruel God Reigns",
    author: "Hiromu Arakawa",
    poster: "https://i.pinimg.com/564x/a1/1e/d9/a11ed98de728cad036a6ff468c123f9a.jpg", // Replace with preferred image
  },
];


const Home = () => {
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

  return (
    <div className="w-full h-screen bg-gray-900 text-white pt-24 px-4 overflow-hidden">
      <div className="flex flex-col md:flex-row gap-8 h-[calc(100vh-80px)]">
        {/* Left: Hero Slider */}
        <div className="md:w-2/3 h-full">
          <Slider {...sliderSettings}>
            {banners.map((b) => (
              <div key={b.id} className="relative h-full rounded-lg overflow-hidden">
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
            >
              <img
                src={m.poster}
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
