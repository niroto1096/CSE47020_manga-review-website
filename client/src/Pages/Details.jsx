import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getMangaById,
  addRating,
  getMyRating,
  getPersonalListStatus,
  updatePersonalListStatus,
} from "@/Api/mangaApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RatingStars from "@/components/RatingStars";
import CommentsPanel from "@/components/CommentsPanel";

const IMAGE_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const Details = () => {
  const { id } = useParams();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);

  // personal reading status
  const [status, setStatus] = useState("Unread");

  // rating (stars: 1..5)
  const [myRating, setMyRating] = useState(0);

  // fetch manga helper
  const fetchManga = async () => {
    const res = await getMangaById(id);
    // Accept both shapes: { data: { ...doc } } or { data: { manga: doc } }
    const doc = res?.data?.manga || res?.data;
    setManga(doc);
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        // 1) load manga
        await fetchManga();

        // 2) user context
        const userId = localStorage.getItem("userId");

        // 3) load user's previous rating
        if (userId) {
          try {
            const { data } = await getMyRating(id, userId);
            const stars = data?.score ? Math.round(Number(data.score) / 2) : 0; // 1..10 → 1..5
            setMyRating(stars);
          } catch (e) {
            console.warn("No prior rating or rating endpoint issue:", e);
            setMyRating(0);
          }

          // 4) load user's saved reading status (if GET endpoint available)
          try {
            const res = await getPersonalListStatus(userId, id);
            const saved = res?.data?.data?.status || res?.data?.status;
            if (saved) setStatus(saved);
          } catch (e) {
            // If not implemented yet, keep default
            // console.warn("Status fetch failed:", e);
          }
        } else {
          setMyRating(0);
        }
      } catch (err) {
        console.error("Failed to fetch manga or user context:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Star rating: save (1..5 stars -> 2..10 score)
  const handleStarClick = async (star) => {
    try {
      setMyRating(star); // optimistic UI
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error("No logged-in user ID found.");
        return;
      }

      const score = star * 2; // 1..5 → 2..10
      const { data } = await addRating(id, { userId, rating: score });

      // If server returns updated doc, trust it
      if (data?.manga) {
        setManga(data.manga);
      } else {
        // fallback optimistic recompute
        setManga((prev) => {
          if (!prev) return prev;
          const prevAvg = Number(prev.rating ?? 0);
          const prevCount = Number(prev.numRatings ?? 0);
          const newCount = prevCount + 1;
          const newAvg = (prevAvg * prevCount + score) / newCount;
          return {
            ...prev,
            rating: Number(newAvg.toFixed(2)),
            numRatings: newCount,
          };
        });
      }

      // refresh to get exact aggregates (handles re-rating)
      await fetchManga();
    } catch (err) {
      console.error("Failed to submit rating:", err);
    }
  };

  // Personal list: change status (create or update)
  const handleStatusChange = async (e) => {
    const next = e.target.value;
    setStatus(next); // optimistic
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.warn(
        "No userId in localStorage; cannot save personal list status."
      );
      return;
    }
    try {
      await updatePersonalListStatus(userId, id, next);
    } catch (err) {
      console.error("Failed to update personal list status:", err);
      // Optional rollback if you want:
      // setStatus(prev => prev);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!manga) {
    return <p className="text-center mt-10 text-gray-500">Manga not found.</p>;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white px-4 py-20">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-4xl font-bold">{manga.title}</h1>
        <p className="text-gray-400 text-sm italic">
          Author: {manga.author || "N/A"}
        </p>
      </div>

      {/* Main Section */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left: Cover Image */}
        <div className="md:w-1/4 w-full">
          <img
            src={`${IMAGE_BASE}/${manga.image}`}
            alt={manga.title}
            className="rounded-lg object-cover w-full"
          />
        </div>

        {/* Right: Info Section */}
        <div className="md:w-3/4 w-full space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-300">
            <p>
              <strong>Ch:</strong> {manga.chapter || "N/A"}
            </p>
            <p>
              <strong>Volume:</strong> {manga.volume ?? "N/A"}
            </p>
            <p>
              <strong>Year:</strong> {manga.release_year || "N/A"}
            </p>
            <p>
              <strong>⭐</strong> {manga.rating ?? 0}/10
              {typeof manga.numRatings !== "undefined" && (
                <span className="text-gray-500"> ({manga.numRatings})</span>
              )}
            </p>
            <p>
              <strong>Rank:</strong> #{manga.rank || "N/A"}
            </p>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed">
            {manga.synopsis}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {(manga.genre || []).map((tag, i) => (
              <span
                key={`g-${i}`}
                className="bg-gray-700 px-3 py-1 rounded-full text-xs"
              >
                {`Genre ${tag}`}
              </span>
            ))}
            {(manga.theme || []).map((tag, i) => (
              <span
                key={`t-${i}`}
                className="bg-gray-700 px-3 py-1 rounded-full text-xs"
              >
                {`Theme ${tag}`}
              </span>
            ))}
          </div>

          {/* Personal Status Dropdown */}
          <div className="mt-6 text-sm">
            <label htmlFor="mangaStatus" className="mr-2">
              My Status:
            </label>
            <select
              id="mangaStatus"
              value={status}
              onChange={handleStatusChange}
              className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600"
            >
              <option value="Reading">Reading</option>
              <option value="Completed">Completed</option>
              <option value="Planned">Planned</option>
              <option value="Unread">Unread</option>
            </select>
          </div>

          {/* Star Rating */}
          <RatingStars value={myRating} onSelect={handleStarClick} />
        </div>
      </div>

      {/* Tabs Below */}
      <div className="max-w-6xl mx-auto mt-10">
        <Tabs defaultValue="synopsis">
          <TabsList className="bg-gray-800 rounded-lg w-full flex justify-start gap-6 px-4 py-2 mb-4">
            <TabsTrigger value="synopsis">Synopsis</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="synopsis">
            <div className="bg-[#1e1e1e] p-6 rounded-lg text-gray-200 leading-relaxed">
              {manga.details || "No synopsis available."}
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <CommentsPanel mangaId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Details;
