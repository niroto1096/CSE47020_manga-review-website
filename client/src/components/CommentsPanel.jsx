import React, { useEffect, useMemo, useState } from "react";
import { getCommentsApi, addCommentApi, reactCommentApi, editCommentApi } from "@/Api/mangaApi";
const IMAGE_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const PAGE_SIZE = 20;

function getUserId() {
  return localStorage.getItem("userId") || "";
}

/** Read reaction state from multiple possible shapes */
function getReactions(c, userId) {
  // preferred new fields
  const likesCount =
    typeof c?.likesCount === "number"
      ? c.likesCount
      : Array.isArray(c?.likes)
      ? c.likes.length
      : Array.isArray(c?.reactors) // legacy single-like array
      ? c.reactors.length
      : Number(c?.likes) || Number(c?.reactionsCount) || 0;

  const dislikesCount =
    typeof c?.dislikesCount === "number"
      ? c.dislikesCount
      : Array.isArray(c?.dislikes)
      ? c.dislikes.length
      : Number(c?.dislikes) || 0;

  // preferred new field
  let userReaction = c?.userReaction || "none";

  // fallback heuristics when no userReaction provided
  if (userReaction === "none" && userId) {
    if (
      Array.isArray(c?.likes) &&
      c.likes.some((u) => String(u) === String(userId))
    ) {
      userReaction = "like";
    } else if (
      Array.isArray(c?.dislikes) &&
      c.dislikes.some((u) => String(u) === String(userId))
    ) {
      userReaction = "dislike";
    } else if (
      Array.isArray(c?.reactors) &&
      c.reactors.some((u) => String(u) === String(userId))
    ) {
      userReaction = "like";
    }
  }

  return { likesCount, dislikesCount, userReaction };
}

/** Optimistic local toggle that keeps mutual exclusivity */
function optimisticToggle(c, userId, nextReaction) {
  const clone = { ...c };

  // Normalize arrays if present; otherwise we’ll fall back to counts
  const haveLikesArr = Array.isArray(clone.likes);
  const haveDislikesArr = Array.isArray(clone.dislikes);

  // Start from current displayed state
  const { likesCount, dislikesCount, userReaction } = getReactions(
    clone,
    userId
  );

  let newLikesCount = likesCount;
  let newDislikesCount = dislikesCount;

  // Helper to apply on arrays if they exist
  const pull = (arr) => arr.filter((u) => String(u) !== String(userId));
  const push = (arr) => (arr.includes(userId) ? arr : [...arr, userId]);

  // Step 1: remove from both
  if (haveLikesArr) clone.likes = pull(clone.likes);
  else if (userReaction === "like") newLikesCount = Math.max(0, likesCount - 1);

  if (haveDislikesArr) clone.dislikes = pull(clone.dislikes);
  else if (userReaction === "dislike")
    newDislikesCount = Math.max(0, dislikesCount - 1);

  // Step 2: add to the selected reaction (if not "none")
  if (nextReaction === "like") {
    if (haveLikesArr) clone.likes = push(clone.likes);
    else newLikesCount = likesCount + (userReaction === "like" ? 0 : 1);
  } else if (nextReaction === "dislike") {
    if (haveDislikesArr) clone.dislikes = push(clone.dislikes);
    else
      newDislikesCount = dislikesCount + (userReaction === "dislike" ? 0 : 1);
  }

  // Persist derived fields for UI
  clone.likesCount = haveLikesArr ? clone.likes.length : newLikesCount;
  clone.dislikesCount = haveDislikesArr
    ? clone.dislikes.length
    : newDislikesCount;
  clone.userReaction = nextReaction;

  return clone;
}

/* ---------- UI ---------- */

const CommentItem = ({ c, onReact, onEdit, currentUserId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(c?.text || c?.comment || "");
  const [isSaving, setIsSaving] = useState(false);

  const author =
    c?.user?.name ||
    c?.user?.username ||
    (typeof c?.user === "string" ? c.user : c?.user?._id) ||
    "Anonymous";
  const when = c?.createdAt ? new Date(c.createdAt).toLocaleString() : "";

  const { likesCount, dislikesCount, userReaction } = getReactions(
    c,
    currentUserId
  );

  const likeActive = userReaction === "like";
  const dislikeActive = userReaction === "dislike";

  const handleLike = () => onReact(c, likeActive ? "none" : "like");
  const handleDislike = () => onReact(c, dislikeActive ? "none" : "dislike");

  // Check if current user is the author of this comment
  const isAuthor = currentUserId && (
    String(c?.user?._id) === String(currentUserId) ||
    String(c?.user) === String(currentUserId)
  );

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(c?.text || c?.comment || "");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText(c?.text || c?.comment || "");
  };

  const handleSave = async () => {
    if (!editText.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      await onEdit(c, editText.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit comment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const avatarUrl = () => {
    const a = c?.user?.avatar;
    if (!a) return "https://c8.alamy.com/comp/2PWERD5/student-avatar-illustration-simple-cartoon-user-portrait-user-profile-icon-youth-avatar-vector-illustration-2PWERD5.jpg";
    if (a.startsWith('http')) return a;
    const clean = String(a).replace(/^\/+/, '');
    return clean.startsWith('uploads/') ? `${IMAGE_BASE}/${clean}` : `${IMAGE_BASE}/uploads/${clean}`;
  };

  return (
    <div
      className="rounded-lg p-3 border
                    bg-gray-100 border-gray-200
                    dark:bg-[#171717] dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={avatarUrl()} alt={author} className="w-8 h-8 rounded-full object-cover border" onError={(e)=>e.currentTarget.style.display='none'} />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div className="truncate max-w-[70%]">@{author}</div>
            <div className="text-[11px]">{when}</div>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full p-2 rounded border text-sm
                       bg-white text-gray-900 border-gray-300
                       focus:outline-none focus:ring-1 focus:ring-gray-400
                       dark:bg-[#121212] dark:text-gray-200 dark:border-gray-700 dark:focus:ring-gray-600"
            rows={3}
            disabled={isSaving}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={!editText.trim() || isSaving}
              className="px-3 py-1 text-xs rounded border transition
                         bg-green-600 text-white border-green-600 hover:bg-green-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-1 text-xs rounded border transition
                         bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300
                         dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p
          className="mt-2 text-sm whitespace-pre-wrap
                      text-gray-800 dark:text-gray-200"
        >
          {c?.text || c?.comment}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={handleLike}
            className={`px-3 py-1 rounded border transition
              ${
                likeActive
                  ? "bg-green-600 text-white border-green-600 dark:bg-green-700 dark:border-green-600"
                  : "bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
              }`}
            title="Like"
            aria-pressed={likeActive}
            aria-label="Like comment"
          >
            👍 {likesCount || 0}
          </button>

          <button
            type="button"
            onClick={handleDislike}
            className={`px-3 py-1 rounded border transition
              ${
                dislikeActive
                  ? "bg-red-600 text-white border-red-600 dark:bg-red-700 dark:border-red-600"
                  : "bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
              }`}
            title="Dislike"
            aria-pressed={dislikeActive}
            aria-label="Dislike comment"
          >
            👎 {dislikesCount || 0}
          </button>
        </div>

        {isAuthor && !isEditing && (
          <button
            type="button"
            onClick={handleEdit}
            className="px-3 py-1 text-xs rounded border transition
                       bg-blue-600 text-white border-blue-600 hover:bg-blue-700
                       dark:bg-blue-700 dark:border-blue-600 dark:hover:bg-blue-800"
            title="Edit comment"
            aria-label="Edit comment"
          >
            ✏️ Edit
          </button>
        )}
      </div>
    </div>
  );
};

const Pager = ({ page, total, limit, onPage }) => {
  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));
  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-3 py-1 rounded border transition
                   bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300
                   disabled:opacity-50
                   dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
      >
        Prev
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Page {page} / {totalPages}
      </span>
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="px-3 py-1 rounded border transition
                   bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-300
                   disabled:opacity-50
                   dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
      >
        Next
      </button>
    </div>
  );
};

const CommentsPanel = ({ mangaId, currentUserId: propUserId }) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const localUserId = getUserId();
  const currentUserId = propUserId || localUserId;

  const canPost = useMemo(
    () => draft.trim().length > 0 && !posting,
    [draft, posting]
  );

  const load = async (toPage = page) => {
    setLoading(true);
    setErr("");
    try {
      // IMPORTANT: ensure getCommentsApi forwards userId as ?userId=... on the request
      const { data, headers } = await getCommentsApi(
        mangaId,
        toPage,
        limit,
        currentUserId
      );
      const comments =
        data?.items || data?.comments || data?.data || data || [];
      const totalCount =
        data?.total ??
        Number(headers?.["x-total-count"]) ??
        Number(headers?.["x-total"]) ??
        comments.length;

      setItems(comments);
      setTotal(totalCount);
      setPage(toPage);
    } catch (e) {
      console.error(e);
      setErr("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mangaId) load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangaId, currentUserId]);

  const handlePost = async () => {
    if (!canPost) return;
    const text = draft.trim();

    if (!currentUserId) {
      setErr("Please log in to comment.");
      return;
    }

    setPosting(true);
    setErr("");

    const temp = {
      _id: `tmp-${Date.now()}`,
      text,
      comment: text,
      manga: mangaId,
      user: currentUserId,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      dislikesCount: 0,
      userReaction: "none",
      __optimistic: true,
    };
    setItems((prev) => [temp, ...prev]);
    setDraft("");

    try {
      await addCommentApi(mangaId, text, currentUserId);
      await load(1);
    } catch (e) {
      console.error(e);
      setItems((prev) => prev.filter((c) => c._id !== temp._id));
      setDraft(text);
      setErr("Failed to post comment.");
    } finally {
      setPosting(false);
    }
  };

  const handleReact = async (comment, intent) => {
    if (!currentUserId) {
      setErr("Please log in to react.");
      return;
    }

    const { userReaction } = getReactions(comment, currentUserId);
    const nextReaction = userReaction === intent ? "none" : intent;

    // optimistic update
    const before = items;
    const after = items.map((c) =>
      (c._id || c.id) === (comment._id || comment.id)
        ? optimisticToggle(c, currentUserId, nextReaction)
        : c
    );
    setItems(after);

    try {
      await reactCommentApi(
        comment._id || comment.id,
        currentUserId,
        nextReaction
      );
      // Optionally refresh the page to get authoritative counts:
      // await load(page);
    } catch (e) {
      console.error(e);
      // rollback
      setItems(before);
      setErr("Failed to update reaction.");
    }
  };

  const handleEdit = async (comment, newText) => {
    if (!currentUserId) {
      setErr("Please log in to edit comments.");
      return;
    }

    try {
      await editCommentApi(comment._id || comment.id, newText, currentUserId);
      // Refresh comments to get the updated comment
      await load(page);
    } catch (e) {
      console.error(e);
      setErr("Failed to edit comment.");
      throw e; // Re-throw so the CommentItem can handle the error
    }
  };

  return (
    <div
      className="p-6 rounded-lg border
                    bg-gray-50 border-gray-200
                    dark:bg-[#1e1e1e] dark:border-gray-800"
    >
      {/* composer */}
      <div className="mb-6">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a comment…"
          rows={3}
          className="w-full p-3 rounded-lg border transition
                     bg-white text-gray-900 border-gray-300
                     focus:outline-none focus:ring-1 focus:ring-gray-400
                     dark:bg-[#121212] dark:text-gray-200 dark:border-gray-700 dark:focus:ring-gray-600"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handlePost}
            disabled={!canPost}
            className="px-4 py-2 rounded-lg font-medium transition
                       bg-gray-900 text-white hover:opacity-90 disabled:opacity-50
                       dark:bg-gray-200 dark:text-black"
          >
            {posting ? "Posting…" : "Post Comment"}
          </button>
        </div>
      </div>

      {/* list */}
      {err && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{err}</p>
      )}
      {loading ? (
        <div className="space-y-3">
          <div className="h-16 rounded-lg animate-pulse bg-gray-200 dark:bg-[#151515]" />
          <div className="h-16 rounded-lg animate-pulse bg-gray-200 dark:bg-[#151515]" />
          <div className="h-16 rounded-lg animate-pulse bg-gray-200 dark:bg-[#151515]" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          No comments yet. Be the first!
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((c) => (
              <CommentItem
                key={c._id || c.id || `${c.user}-${c.createdAt}`}
                c={c}
                onReact={handleReact}
                onEdit={handleEdit}
                currentUserId={currentUserId}
              />
            ))}
          </div>
          <Pager
            page={page}
            total={total}
            limit={limit}
            onPage={(p) => load(p)}
          />
        </>
      )}
    </div>
  );
};

export default CommentsPanel;
