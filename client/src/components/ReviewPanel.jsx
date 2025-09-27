import React, { useEffect, useState } from "react";
import { useToast } from "@/Context/ToastContext";
import { Link } from 'react-router-dom';
const IMAGE_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";
import { 
  createOrUpdateReviewApi, 
  getUserReviewApi, 
  getMangaReviewsApi, 
  deleteReviewApi,
  reactReviewApi
} from "@/Api/mangaApi";

const ReviewPanel = ({ mangaId, currentUserId }) => {
  const [userReview, setUserReview] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [err, setErr] = useState("");
  const toast = useToast();

  const loadUserReview = async () => {
    if (!currentUserId) return;
    
    try {
      const { data } = await getUserReviewApi(mangaId, currentUserId);
      setUserReview(data.review);
      if (data.review) {
        setReviewText(data.review.review);
        setReviewRating(data.review.rating);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Failed to load user review:", err);
      }
    }
  };

  const loadAllReviews = async (pageNum = 1) => {
    try {
      const { data } = await getMangaReviewsApi(mangaId, pageNum, 5);
      setAllReviews(data.items || []);
      setTotalPages(data.pages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setError("Failed to load reviews");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([
          loadUserReview(),
          loadAllReviews(1)
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (mangaId) {
      loadData();
    }
  }, [mangaId, currentUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      setError("Please log in to write a review");
      return;
    }

    if (!reviewText.trim() || reviewText.trim().length < 10) {
      setError("Review must be at least 10 characters long");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { data } = await createOrUpdateReviewApi(mangaId, reviewText.trim(), reviewRating, currentUserId);
      // Show XP award toast if available
      const xp = data?.xp;
      if (xp && xp.awarded) {
        const msg = xp.leveledUp
          ? `You earned +${xp.awarded} XP and leveled up to Level ${xp.level}!`
          : `You earned +${xp.awarded} XP!`;
        toast.success(msg);
        // tell profile to refresh xp/level
        window.dispatchEvent(new Event('user:xp-updated'));
      }
      await loadUserReview();
      await loadAllReviews(page);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save review:", err);
      setError("Failed to save review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setReviewText(userReview?.review || "");
    setReviewRating(userReview?.rating || 5);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setReviewText(userReview?.review || "");
    setReviewRating(userReview?.rating || 5);
    setError("");
  };

  const handleDelete = async () => {
    if (!userReview || !currentUserId) return;
    
    if (!window.confirm("Are you sure you want to delete your review?")) {
      return;
    }

    try {
      await deleteReviewApi(userReview._id, currentUserId);
      setUserReview(null);
      setReviewText("");
      setReviewRating(5);
      setIsEditing(false);
      await loadAllReviews(page);
    } catch (err) {
      console.error("Failed to delete review:", err);
      setError("Failed to delete review");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Reaction helpers (mirrors CommentsPanel behavior)
  function getReactions(r) {
    const likesCount = typeof r?.likesCount === "number" ? r.likesCount : Array.isArray(r?.likes) ? r.likes.length : Number(r?.likes) || 0;
    const dislikesCount = typeof r?.dislikesCount === "number" ? r.dislikesCount : Array.isArray(r?.dislikes) ? r.dislikes.length : Number(r?.dislikes) || 0;
    let userReaction = r?.userReaction || "none";
    if (userReaction === "none" && currentUserId) {
      if (Array.isArray(r?.likes) && r.likes.some((u) => String(u) === String(currentUserId))) userReaction = "like";
      else if (Array.isArray(r?.dislikes) && r.dislikes.some((u) => String(u) === String(currentUserId))) userReaction = "dislike";
    }
    return { likesCount, dislikesCount, userReaction };
  }

  function optimisticToggle(review, nextReaction) {
    const userId = currentUserId;
    const clone = { ...review };
    const haveLikesArr = Array.isArray(clone.likes);
    const haveDislikesArr = Array.isArray(clone.dislikes);
    const { likesCount, dislikesCount, userReaction } = getReactions(clone);

    let newLikesCount = likesCount;
    let newDislikesCount = dislikesCount;

    const pull = (arr) => arr.filter((u) => String(u) !== String(userId));
    const push = (arr) => (arr.includes(userId) ? arr : [...arr, userId]);

    if (haveLikesArr) clone.likes = pull(clone.likes);
    else if (userReaction === "like") newLikesCount = Math.max(0, likesCount - 1);

    if (haveDislikesArr) clone.dislikes = pull(clone.dislikes);
    else if (userReaction === "dislike") newDislikesCount = Math.max(0, dislikesCount - 1);

    if (nextReaction === "like") {
      if (haveLikesArr) clone.likes = push(clone.likes);
      else newLikesCount = likesCount + (userReaction === "like" ? 0 : 1);
    } else if (nextReaction === "dislike") {
      if (haveDislikesArr) clone.dislikes = push(clone.dislikes);
      else newDislikesCount = dislikesCount + (userReaction === "dislike" ? 0 : 1);
    }

    clone.likesCount = haveLikesArr ? clone.likes.length : newLikesCount;
    clone.dislikesCount = haveDislikesArr ? clone.dislikes.length : newDislikesCount;
    clone.userReaction = nextReaction;
    return clone;
  }

  const handleReact = async (review, intent) => {
    if (!currentUserId) {
      setErr("Please log in to react.");
      return;
    }
    const { userReaction } = getReactions(review);
    const nextReaction = userReaction === intent ? "none" : intent;

    const before = allReviews;
    const after = allReviews.map((r) => (String(r._id) === String(review._id) ? optimisticToggle(r, nextReaction) : r));
    setAllReviews(after);

    try {
      await reactReviewApi(review._id, currentUserId, nextReaction);
    } catch (e) {
      console.error(e);
      setAllReviews(before);
      setErr("Failed to update reaction.");
    }
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onChange?.(star) : undefined}
            className={`text-lg ${
              star <= rating
                ? "text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            } ${interactive ? "hover:text-yellow-300 cursor-pointer" : ""}`}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 rounded-lg border bg-gray-50 border-gray-200 dark:bg-[#1e1e1e] dark:border-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Review Section */}
      <div className="p-6 rounded-lg border bg-gray-50 border-gray-200 dark:bg-[#1e1e1e] dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {userReview ? "Your Review" : "Write a Review"}
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {!currentUserId ? (
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to write a review
          </p>
        ) : userReview && !isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderStars(userReview.rating)}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(userReview.createdAt)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 text-xs rounded border transition
                             bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 text-xs rounded border transition
                             bg-red-600 text-white border-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {userReview.review}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating
              </label>
              {renderStars(reviewRating, true, setReviewRating)}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review (minimum 10 characters)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review here..."
                rows={4}
                className="w-full p-3 rounded-lg border transition
                           bg-white text-gray-900 border-gray-300
                           focus:outline-none focus:ring-1 focus:ring-gray-400
                           dark:bg-[#121212] dark:text-gray-200 dark:border-gray-700 dark:focus:ring-gray-600"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!reviewText.trim() || reviewText.trim().length < 10 || isSubmitting}
                className="px-4 py-2 rounded-lg font-medium transition
                           bg-gray-900 text-white hover:opacity-90 disabled:opacity-50
                           dark:bg-gray-200 dark:text-black"
              >
                {isSubmitting ? "Saving..." : userReview ? "Update Review" : "Submit Review"}
              </button>
              {userReview && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-medium transition
                             bg-gray-200 text-gray-900 hover:bg-gray-300
                             dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* All Reviews Section */}
      <div className="p-6 rounded-lg border bg-gray-50 border-gray-200 dark:bg-[#1e1e1e] dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          All Reviews ({allReviews.length > 0 ? allReviews[0].total || allReviews.length : 0})
        </h3>

        {allReviews.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No reviews yet. Be the first to review this manga!
          </p>
        ) : (
          <div className="space-y-4">
            {allReviews.map((review) => (
              <div
                key={review._id}
                className="p-4 rounded-lg border bg-white border-gray-200 dark:bg-[#121212] dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                      {/** avatar */}
                      <Link to={`/user/${review.user?._id || review.user?.id || review.user}`}
                        className="flex items-center gap-2"
                      >
                      <img
                        src={(() => {
                          const a = review.user?.avatar;
                          if (!a) return "https://c8.alamy.com/comp/2PWERD5/student-avatar-illustration-simple-cartoon-user-portrait-user-profile-icon-youth-avatar-vector-illustration-2PWERD5.jpg";
                          if (a.startsWith('http')) return a;
                          const clean = String(a).replace(/^\/+/, '');
                          return clean.startsWith('uploads/') ? `${IMAGE_BASE}/${clean}` : `${IMAGE_BASE}/uploads/${clean}`;
                        })()}
                        alt={review.user?.name || review.user?.username || 'Avatar'}
                        className="w-8 h-8 rounded-full object-cover border"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {review.user?.name || review.user?.username || "Anonymous"}
                      </span>
                      </Link>
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {review.review}
                </p>
                {/* Reactions */}
                <div className="mt-3 flex items-center gap-3 text-sm">
                  {(() => {
                    const { likesCount, dislikesCount, userReaction } = getReactions(review);
                    const likeActive = userReaction === "like";
                    const dislikeActive = userReaction === "dislike";
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReact(review, "like")}
                          className={`px-3 py-1 rounded border transition ${
                            likeActive
                              ? "bg-green-600 text-white border-green-600 dark:bg-green-700 dark:border-green-600"
                              : "bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                          }`}
                          title="Like review"
                          aria-pressed={likeActive}
                          aria-label="Like review"
                        >
                          👍 {likesCount || 0}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReact(review, "dislike")}
                          className={`px-3 py-1 rounded border transition ${
                            dislikeActive
                              ? "bg-red-600 text-white border-red-600 dark:bg-red-700 dark:border-red-600"
                              : "bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                          }`}
                          title="Dislike review"
                          aria-pressed={dislikeActive}
                          aria-label="Dislike review"
                        >
                          👎 {dislikesCount || 0}
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => loadAllReviews(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded border transition
                             bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300
                             disabled:opacity-50
                             dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => loadAllReviews(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded border transition
                             bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300
                             disabled:opacity-50
                             dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPanel;
