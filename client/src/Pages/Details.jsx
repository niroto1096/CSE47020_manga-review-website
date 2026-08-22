import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMangaById,
  getPersonalListStatus,
  updatePersonalListStatus,
  getAllManga,
  getUserReviewApi,
  getReviewSummaryApi,
} from "@/Api/mangaApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RatingStars from "@/components/RatingStars";
import CommentsPanel from "@/components/CommentsPanel";
import ReviewPanel from "@/components/ReviewPanel";
import { addFavoriteApi, removeFavoriteApi, getFavoritesApi } from '@/Api/authApi';

const IMAGE_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const buildImg = (img) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  return `${IMAGE_BASE}/${String(img).replace(/^\/+/, "")}`;
};

const normalizeTags = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

/** ---------- Recently Viewed helpers ---------- */
const RECENT_KEY = "recentManga";
const MAX_RECENT = 5;

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

function saveRecent(arr) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
  } catch {
    // storage might be full/blocked; ignore
  }
}

function pushRecent(manga) {
  if (!manga?._id && !manga?.id) return;
  const id = manga._id || manga.id;
  const entry = {
    id,
    title: manga.title || "Untitled",
    image: manga.image || "",
    rating: Number(manga.rating ?? 0),
    viewedAt: Date.now(),
  };

  const prev = loadRecent();
  // remove any existing with same id
  const filtered = prev.filter((x) => x.id !== id);
  // add to front
  const next = [entry, ...filtered].slice(0, MAX_RECENT);
  saveRecent(next);
  return next;
}

const Details = () => {
  const { id } = useParams();

  // Share button UI
  const [copied, setCopied] = useState(false);
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: manga?.title || "Check this out",
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch (e) {
      console.error("Share/copy failed:", e);
    }
  };

  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);

  // ranking state (computed)
  const [rank, setRank] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // personal reading status
  const [status, setStatus] = useState("Unread");

  // rating (stars: 1..5)
  const [myRating, setMyRating] = useState(0);
  const [avgRating5, setAvgRating5] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // recently viewed
  const [recent, setRecent] = useState(loadRecent());
  const [recentSummaries, setRecentSummaries] = useState({});
  const [isFavorite, setIsFavorite] = useState(false);

  const currentUserId = localStorage.getItem("userId") || null;
  const [userReviewStars, setUserReviewStars] = useState(0);

  // fetch manga and return the doc
  const fetchManga = async () => {
    const res = await getMangaById(id);
    const doc = res?.data?.manga || res?.data || null;
    setManga(doc);
    return doc;
  };

  // compute dense rank based on rating across all mangas
  const computeRank = async (doc) => {
    if (!doc) return;
    // Determine if doc has any ratings. Prefer denormalized numRatings if present,
    // otherwise fall back to querying review summary.
    let targetScore = Number(doc.rating ?? 0);
    let targetCount = Number(doc?.numRatings ?? doc?.num_ratings ?? 0);

    if (!Number.isFinite(targetCount) || targetCount === 0) {
      // try to fetch summary to see if there are reviews
      try {
        const { data: summary } = await getReviewSummaryApi(String(doc._id || doc.id));
        targetCount = Number(summary?.count ?? targetCount ?? 0);
        // prefer any average reported by summary if doc.rating is missing
        if (!Number.isFinite(targetScore) || targetScore === 0) {
          targetScore = Number(summary?.average ?? targetScore ?? 0);
        }
      } catch (e) {
        // ignore and proceed with available values
      }
    }

    // If there are no reviews, show N/A for rank
    if (!Number.isFinite(targetCount) || targetCount === 0) {
      setRank(null);
      // still attempt to set total count from catalog
      try {
        const resAll = await getAllManga("");
        const all = resAll?.data?.manga || resAll?.data || [];
        setTotalCount(all.length);
      } catch {
        setTotalCount(0);
      }
      return;
    }

  const resAll = await getAllManga("");
  const all = resAll?.data?.manga || resAll?.data || [];
  setTotalCount(all.length);

    // Rank by: higher rating first, then higher numRatings as tiebreaker.
    // Count how many mangas are strictly better than the target according to this ordering.
    const targetId = String(doc._id || doc.id);

    const tScore = Number(targetScore ?? 0);
    const tCount = Number(targetCount ?? 0);

    const countBetter = all.reduce((acc, m) => {
      const mid = String(m?._id || m?.id || "");
      if (mid === targetId) return acc; // skip target itself
      const rScore = Number(m?.rating ?? 0);
      const rCount = Number(m?.numRatings ?? m?.num_ratings ?? 0);

      // m is better than target if rating higher, or same rating but more raters
      if (Number.isFinite(rScore) && rScore > tScore) return acc + 1;
      if (Number.isFinite(rScore) && rScore === tScore && Number.isFinite(rCount) && rCount > tCount) return acc + 1;
      return acc;
    }, 0);

    setRank(countBetter + 1);
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const doc = await fetchManga();
        await computeRank(doc);
        try {
          const { data: summary } = await getReviewSummaryApi(id);
          setAvgRating5(Number(summary?.average ?? 0));
          setReviewCount(Number(summary?.count ?? 0));
        } catch {
          setAvgRating5(0);
          setReviewCount(0);
        }

        // ----- Save to "recently viewed" as soon as the doc is ready -----
        if (doc) {
          const next = pushRecent(doc);
          if (next) setRecent(next);
        }
        // ------------------------------------------------------------------

        if (currentUserId) {
          try {
            const { data } = await getUserReviewApi(id, currentUserId);
            const stars = Number(data?.review?.rating ?? 0);
            setMyRating(stars);
            setUserReviewStars(stars);
          } catch {
            setMyRating(0);
            setUserReviewStars(0);
          }

          // check favorites
          try {
            const favs = await getFavoritesApi();
            const list = favs?.data?.favorites || favs?.data || [];
            const found = list.some((m) => String(m?._id || m?.id) === String(id));
            setIsFavorite(Boolean(found));
          } catch (e) {
            // ignore
          }

          try {
            const res = await getPersonalListStatus(currentUserId, id);
            const saved = res?.data?.data?.status || res?.data?.status;
            if (saved) setStatus(saved);
          } catch {
            /* ignore if not implemented */
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

  // Load average review summaries for Recently Viewed items (out of 5)
  useEffect(() => {
    const ids = recent.map((i) => String(i.id));
    if (ids.length === 0) return;
    (async () => {
      try {
        const uniqueIds = Array.from(new Set(ids));
        const entries = await Promise.all(
          uniqueIds.map(async (mid) => {
            if (recentSummaries[mid]) return [mid, recentSummaries[mid]];
            try {
              const { data } = await getReviewSummaryApi(mid);
              return [mid, { average: Number(data?.average ?? 0), count: Number(data?.count ?? 0) }];
            } catch {
              return [mid, { average: 0, count: 0 }];
            }
          })
        );
        setRecentSummaries((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      } catch {
        /* ignore */
      }
    })();
  }, [recent]);

  // No interactive star rating; show user's review rating if available

  // Personal list: change status (create or update)
  const handleStatusChange = async (e) => {
    const next = e.target.value;
    setStatus(next);
    if (!currentUserId) {
      console.warn("No userId; cannot save personal list status.");
      return;
    }
    try {
      await updatePersonalListStatus(currentUserId, id, next);
    } catch (err) {
      console.error("Failed to update personal list status:", err);
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
    return (
      <p className="text-center mt-10 text-gray-600 dark:text-gray-400">
        Manga not found.
      </p>
    );
  }

  const genres = normalizeTags(manga.genre);
  const themes = normalizeTags(manga.theme);

  return (
    <div className="min-h-screen px-4 py-20 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left: title + author */}
          <div>
            <h1 className="text-4xl font-bold">{manga.title}</h1>
            <p className="text-sm italic text-gray-600 dark:text-gray-400">
              Author: {manga.author || "N/A"}
            </p>
          </div>

          {/* Right: Share Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              aria-label="Share this page"
              className="px-4 py-2 text-sm rounded-lg border transition
                         bg-gray-200 hover:bg-gray-300 border-gray-300
                         dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
            >
              Share / Copy Link
            </button>
            {copied && (
              <span className="text-xs text-green-600 dark:text-green-400">
                Copied!
              </span>
            )}
            <button
              onClick={async () => {
                const uid = currentUserId;
                if (!uid) return alert('Please log in to manage favorites');
                try {
                  if (isFavorite) {
                    await removeFavoriteApi(id);
                    setIsFavorite(false);
                  } else {
                    await addFavoriteApi(id);
                    setIsFavorite(true);
                  }
                } catch (e) {
                  console.error('favorite toggle failed', e);
                }
              }}
              className={`px-3 py-2 text-sm rounded-lg border transition ${isFavorite ? 'bg-yellow-400 text-black' : 'bg-gray-200 dark:bg-gray-800'}`}
            >
              {isFavorite ? '★ Favorited' : '☆ Favorite'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left: Cover Image */}
        <div className="md:w-1/4 w-full">
          <img
            src={buildImg(manga.image)}
            alt={manga.title}
            className="rounded-lg object-cover w-full border border-gray-200 dark:border-gray-800"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>

        {/* Right: Info Section */}
        <div className="md:w-3/4 w-full space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
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
              <strong>⭐</strong> {avgRating5.toFixed(2)}/5
              <span className="text-gray-500 dark:text-gray-400"> ({reviewCount})</span>
            </p>
          </div>

          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {manga.synopsis || manga.details || "No synopsis available."}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {genres.map((tag, i) => (
              <span
                key={`g-${i}`}
                className="px-3 py-1 rounded-full text-xs
                           bg-gray-200 text-gray-800
                           dark:bg-gray-700 dark:text-gray-100"
              >
                {tag}
              </span>
            ))}
            {themes.map((tag, i) => (
              <span
                key={`t-${i}`}
                className="px-3 py-1 rounded-full text-xs
                           bg-gray-200 text-gray-800
                           dark:bg-gray-700 dark:text-gray-100"
              >
                {tag}
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
              className="px-2 py-1 rounded border
                         bg-gray-100 text-gray-900 border-gray-300
                         dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="Reading">Reading</option>
              <option value="Completed">Completed</option>
              <option value="Planned">Planned</option>
              <option value="Unread">Unread</option>
            </select>
          </div>

          {/* Star Rating and Review Button */}
          <div className="flex items-center gap-4">
            <RatingStars value={userReviewStars || myRating} readOnly />
          </div>
        </div>
      </div>

      {/* Tabs Below */}
      <div className="max-w-6xl mx-auto mt-10">
        <Tabs defaultValue="synopsis">
          <TabsList
            className="w-full flex justify-start gap-6 px-4 py-2 mb-4 rounded-lg
                               bg-gray-100 dark:bg-gray-800"
          >
            <TabsTrigger value="synopsis">Synopsis</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="synopsis">
            <div
              className="p-6 rounded-lg leading-relaxed border
                            bg-gray-100 text-gray-800 border-gray-200
                            dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800"
            >
              {manga.details || manga.synopsis || "No synopsis available."}
            </div>
          </TabsContent>

          <TabsContent value="comments">
            <CommentsPanel mangaId={id} currentUserId={currentUserId} />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewPanel mangaId={id} currentUserId={currentUserId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ---------- Recently Viewed (place this under your Recommended) ---------- */}
      {recent.length > 0 && (
        <div className="max-w-6xl mx-auto mt-12">
          <h2 className="text-xl font-semibold mb-3">Recently Viewed</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recent.map((item) => (
              <Link
                key={item.id}
                to={`/manga-detail/${item.id}`}
                className="min-w-[160px] max-w-[160px] shrink-0"
                title={item.title}
              >
                <div
                  className="rounded-lg border overflow-hidden hover:shadow transition
                             border-gray-200 dark:border-gray-800"
                >
                  <img
                    src={buildImg(item.image)}
                    alt={item.title}
                    className="w-full h-44 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <div className="p-2">
                    <div className="text-sm font-medium line-clamp-2">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {(() => {
                        const s = recentSummaries[String(item.id)] || { average: 0, count: 0 };
                        return `⭐ ${Number(s.average || 0).toFixed(2)}/5 (${s.count})`;
                      })()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {/* ----------------------------------------------------------------------- */}
    </div>
  );
};

export default Details;
