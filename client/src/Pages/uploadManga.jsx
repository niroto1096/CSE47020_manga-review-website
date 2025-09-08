import React, { useState } from "react";
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

const UploadManga = () => {
  const [data, setData] = useState({
    title: "",
    image: null,
    featured: false,
    details: "",
    release_date: null, // Date object
    genre: [""],
    theme: [""],
    rating: 0,
    author: "",
    synopsis: "",
    release_year: "",
    volume: "",
    chapter: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setData((p) => ({ ...p, [name]: checked }));
    } else if (type === "file") {
      const file = files?.[0] || null;
      setData((p) => ({ ...p, [name]: file }));
      setPreview(file ? URL.createObjectURL(file) : null);
    } else {
      setData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleGenreChange = (idx, value) => {
    setData((p) => {
      const next = [...p.genre];
      next[idx] = value;
      return { ...p, genre: next };
    });
  };

  const handleThemeChange = (idx, value) => {
    setData((p) => {
      const next = [...p.theme];
      next[idx] = value;
      return { ...p, theme: next };
    });
  };

  const addGenre = () => setData((p) => ({ ...p, genre: [...p.genre, ""] }));
  const addTheme = () => setData((p) => ({ ...p, theme: [...p.theme, ""] }));

  const removeGenre = (idx) =>
    setData((p) => ({ ...p, genre: p.genre.filter((_, i) => i !== idx) }));
  const removeTheme = (idx) =>
    setData((p) => ({ ...p, theme: p.theme.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();

      // Append primitives
      formData.append("title", data.title);
      formData.append("featured", String(data.featured));
      formData.append("details", data.details);
      formData.append(
        "release_date",
        data.release_date ? data.release_date.toISOString() : ""
      );
      formData.append("rating", String(data.rating || 0));
      formData.append("author", data.author);
      formData.append("synopsis", data.synopsis);
      formData.append("release_year", data.release_year);
      formData.append("volume", data.volume);
      formData.append("chapter", data.chapter);

      // Arrays (backend expects repeated keys)
      data.genre.forEach((g) => formData.append("genre", g));
      data.theme.forEach((t) => formData.append("theme", t));

      // Image
      if (data.image) formData.append("image", data.image);

      const res = await uploadManga(formData);
      console.log("Upload successful", res);
      alert("Manga uploaded successfully");
      // Optional: reset form
      setData({
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
      setPreview(null);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload manga.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 mt-20 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 rounded-lg">
      <h1 className="text-2xl font-semibold">Upload Manga</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            name="title"
            value={data.title}
            onChange={handleChange}
            placeholder="Manga Title"
            required
          />
        </div>

        {/* Author */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Author</label>
          <Input
            name="author"
            value={data.author}
            onChange={handleChange}
            placeholder="Author / Creator"
            required
          />
        </div>

        {/* Release Year / Volume / Chapter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Release Year</label>
            <Input
              name="release_year"
              value={data.release_year}
              onChange={handleChange}
              placeholder="e.g. 2023"
              inputMode="numeric"
              pattern="\d*"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Volume</label>
            <Input
              name="volume"
              value={data.volume}
              onChange={handleChange}
              placeholder="e.g. 12"
              inputMode="numeric"
              pattern="\d*"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Chapter</label>
            <Input
              name="chapter"
              value={data.chapter}
              onChange={handleChange}
              placeholder="e.g. 120"
              inputMode="numeric"
              pattern="\d*"
            />
          </div>
        </div>

        {/* Release Date picker */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Release Date (optional)</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className="w-full justify-start"
              >
                {data.release_date
                  ? format(data.release_date, "PPP")
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <Calendar
                mode="single"
                selected={data.release_date || undefined}
                onSelect={(d) =>
                  setData((p) => ({ ...p, release_date: d ?? null }))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Featured + Rating */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Featured */}
          <div className="flex items-center gap-3">
            <input
              id="featured"
              type="checkbox"
              name="featured"
              checked={data.featured}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <label htmlFor="featured" className="text-sm">
              Mark as Featured
            </label>
          </div>

          {/* Rating (0..10) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Rating</label>
            <Select
              value={String(data.rating)}
              onValueChange={(v) =>
                setData((p) => ({ ...p, rating: Number(v) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 11 }).map((_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {i}/10
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Genres */}
        <div>
          <label className="block font-medium mb-2">Genres</label>
          <div className="space-y-2">
            {data.genre.map((item, index) => (
              <div key={`g-${index}`} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => handleGenreChange(index, e.target.value)}
                  placeholder={`Genre ${index + 1}`}
                  required
                />
                {data.genre.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeGenre(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2">
            <Button type="button" variant="outline" onClick={addGenre}>
              + Add Genre
            </Button>
          </div>
        </div>

        {/* Themes */}
        <div>
          <label className="block font-medium mb-2">Themes</label>
          <div className="space-y-2">
            {data.theme.map((item, index) => (
              <div key={`t-${index}`} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => handleThemeChange(index, e.target.value)}
                  placeholder={`Theme ${index + 1}`}
                  required
                />
                {data.theme.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeTheme(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2">
            <Button type="button" variant="outline" onClick={addTheme}>
              + Add Theme
            </Button>
          </div>
        </div>

        {/* Image */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cover Image</label>
          <Input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            required
          />
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="mt-2 w-full h-64 object-cover rounded-md border border-gray-300 dark:border-gray-700"
            />
          )}
        </div>

        {/* Details */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Details</label>
          <textarea
            name="details"
            value={data.details}
            onChange={handleChange}
            placeholder="Manga details..."
            rows={4}
            className="w-full rounded-md p-3 border transition
                       bg-white text-gray-900 border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            required
          />
        </div>

        {/* Synopsis */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Synopsis</label>
          <textarea
            name="synopsis"
            value={data.synopsis}
            onChange={handleChange}
            placeholder="Manga synopsis..."
            rows={3}
            className="w-full rounded-md p-3 border transition
                       bg-white text-gray-900 border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-blue-500
                       dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Uploading..." : "Upload Manga"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UploadManga;
