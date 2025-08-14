import React, { useContext, useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { format } from "date-fns";
import { uploadManga } from "../Api/mangaApi";
import { UserContext } from "../Context/UserContext";

const UploadManga = () => {
  const [data, setData] = useState({
    title: "",
    image: null,
    featured: false,
    details: "",
    release_date: null,
    genre: [""],
    theme: [""],
    rating: 0,
    author: "",
    synopsis: "",
    release_year: "",
    volume: "",
    chapter: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenreChange = (index, value) => {
    const updated = [...data.genre];
    updated[index] = value;
    setData((prev) => ({ ...prev, genre: updated }));
  };

  const handleThemeChange = (index, value) => {
    const updated = [...data.theme];
    updated[index] = value;
    setData((prev) => ({ ...prev, theme: updated }));
  };

  const addGenre = () =>
    setData((prev) => ({ ...prev, genre: [...prev.genre, ""] }));

  const addTheme = () =>
    setData((prev) => ({ ...prev, theme: [...prev.theme, ""] }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === "release_date") {
        formData.append(key, data[key]?.toISOString() || "");
      } else if (Array.isArray(data[key])) {
        data[key].forEach((item) => formData.append(key, item));
      } else {
        formData.append(key, data[key]);
      }
    });

    try {
      const response = await uploadManga(formData);
      console.log("Upload successful", response);
      alert("Manga uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6   space-y-6 mt-20">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="title"
          value={data.title}
          onChange={handleChange}
          placeholder="Manga Title"
          required
        />

        <Input
          name="author"
          value={data.author}
          onChange={handleChange}
          placeholder="Author / Director"
          required
        />

        <Input
          name="release_year"
          value={data.release_year}
          onChange={handleChange}
          placeholder="Release Year"
          required
        />

        <Input
          name="volume"
          value={data.volume}
          onChange={handleChange}
          placeholder="Volume"
        />

        <Input
          name="chapter"
          value={data.chapter}
          onChange={handleChange}
          placeholder="Chapter"
        />

      

      

        

        {/* Dynamic Genre Inputs */}
        <div>
          <label className="block font-medium mb-1">Genres</label>
          {data.genre.map((item, index) => (
            <Input
              key={index}
              value={item}
              onChange={(e) => handleGenreChange(index, e.target.value)}
              placeholder={`Genre ${index + 1}`}
              className="mb-2"
              required
            />
          ))}
          <Button type="button" variant="outline" onClick={addGenre}>
            + Add Genre
          </Button>
        </div>

        {/* Dynamic Theme Inputs */}
        <div>
          <label className="block font-medium mb-1">Themes</label>
          {data.theme.map((item, index) => (
            <Input
              key={index}
              value={item}
              onChange={(e) => handleThemeChange(index, e.target.value)}
              placeholder={`Theme ${index + 1}`}
              className="mb-2"
              required
            />
          ))}
          <Button type="button" variant="outline" onClick={addTheme}>
            + Add Theme
          </Button>
        </div>

        {/* Image Upload */}
        <Input
          type="file"
          name="image"
          onChange={(e) =>
            setData((prev) => ({ ...prev, image: e.target.files[0] }))
          }
          required
        />

        {/* Textareas */}
        <textarea
          name="details"
          value={data.details}
          onChange={handleChange}
          placeholder="Manga details..."
          rows="4"
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        ></textarea>

        <textarea
          name="synopsis"
          value={data.synopsis}
          onChange={handleChange}
          placeholder="Manga synopsis..."
          rows="3"
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>

        {/* Submit */}
        <Button type="submit">Upload Manga</Button>
      </form>
    </div>
  );
};

export default UploadManga;
