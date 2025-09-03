import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMangaById, addRating, getMyRating } from "@/Api/mangaApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const Details = () => {
  const { id } = useParams();
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);

  // comment states
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  // status state
  const [status, setStatus] = useState("Plan to Read");

  // rating state (user’s star selection: 1..5)
  const [myRating, setMyRating] = useState(0);

  // fetch helper so we can refresh after rating
  const fetchManga = async () => {
    const res = await getMangaById(id);
    setManga(res.data);
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        // 1) load manga
        await fetchManga();

        // 2) load user's previous rating (if logged in)
        const userId = localStorage.getItem("userId");
        if (userId) {
          const { data } = await getMyRating(id, userId);
          // data.score is on 1..10 → convert to 1..5 stars
          const stars = data?.score ? Math.round(Number(data.score) / 2) : 0;
          setMyRating(stars);
        } else {
          setMyRating(0);
        }
      } catch (err) {
        console.error("Failed to fetch manga or my rating:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddComment = () => {
    if (comment.trim() === "") return;
    setComments((prev) => [...prev, { text: comment.trim(), reactions: 0 }]);
    setComment("");
  };

  // Like reaction on a comment (not star rating)
  const handleReact = async (index) => {
    try {
      // This is just demo UI behavior for local comments list
      setComments((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, reactions: (c.reactions || 0) + 1 } : c
        )
      );
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };

  // Star rating: save user’s rating (1..5 stars -> 2..10 score)
  const handleStarClick = async (star) => {
    try {
      setMyRating(star); // immediate UI feedback

      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.error(
          "No logged-in user ID found. Ensure you save it at login."
        );
        return;
      }

      const score = star * 2; // map 1..5 -> 2..10

      // Submit to backend
      const { data } = await addRating(id, { userId, rating: score });

      // Prefer server truth if returned
      if (data?.manga) {
        setManga(data.manga);
      } else {
        // Fallback: optimistic average if server didn't return updated doc
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

      // Finalize by refreshing from the server to ensure exact numbers (handles re-rating too)
      await fetchManga();
    } catch (err) {
      console.error("Failed to submit rating:", err);
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
            src={`http://localhost:8000/${manga.image}`}
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
              <strong>Volume:</strong> {manga.volume}
            </p>
            <p>
              <strong>Year:</strong> {manga.release_year || "N/A"}
            </p>
            <p>
              <strong>⭐</strong> {manga.rating || 0}/10
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
                key={i}
                className="bg-gray-700 px-3 py-1 rounded-full text-xs"
              >
                {`Genre ${tag}`}
              </span>
            ))}
            {(manga.theme || []).map((tag, i) => (
              <span
                key={i}
                className="bg-gray-700 px-3 py-1 rounded-full text-xs"
              >
                {`Theme ${tag}`}
              </span>
            ))}
          </div>

          {/* Status Dropdown */}
          <div className="mt-6 text-sm">
            <label htmlFor="mangaStatus" className="mr-2">
              My Status:
            </label>
            <select
              id="mangaStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-gray-800 text-white px-2 py-1 rounded border border-gray-600"
            >
              <option value="Reading">Reading</option>
              <option value="Completed">Completed</option>
              <option value="Plan to Read">Plan to Read</option>
            </select>
          </div>

          {/* Star Rating */}
          <div className="mt-6 text-sm">
            <label className="mr-2">My Rating:</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  className="text-2xl focus:outline-none"
                  title={`${star}/5 (= ${star * 2}/10)`}
                >
                  {star <= myRating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
            {myRating > 0 && (
              <p className="text-gray-400 mt-1">
                You rated this {myRating}/5 ({myRating * 2}/10)
              </p>
            )}
          </div>
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
            <div className="bg-[#1e1e1e] p-6 rounded-lg text-gray-200">
              {/* Existing comments (local demo list) */}
              {comments.length === 0 ? (
                <p className="text-gray-400 italic mb-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <ul className="space-y-2 mb-4">
                  {comments.map((c, i) => (
                    <li
                      key={i}
                      className="bg-gray-800 px-3 py-2 rounded-md flex items-center justify-between"
                    >
                      <span>{c.text}</span>
                      <button
                        onClick={() => handleReact(i)}
                        className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-500"
                      >
                        👍 {c.reactions}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Input field */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-blue-600 rounded text-sm font-semibold hover:bg-blue-700"
                >
                  Post
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Details;
