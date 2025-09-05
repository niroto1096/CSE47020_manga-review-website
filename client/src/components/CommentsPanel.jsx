import React, { useEffect, useMemo, useState } from "react";
import { getCommentsApi, addCommentApi, reactCommentApi } from "@/Api/mangaApi";

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

const CommentItem = ({ c, onReact, currentUserId }) => {
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

  return (
    <div className="border border-gray-700 rounded-lg p-3 bg-[#171717]">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="truncate max-w-[70%]">@{author}</span>
        <span>{when}</span>
      </div>

      <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">
        {c?.text || c?.comment}
      </p>

      <div className="mt-3 flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={handleLike}
          className={`px-3 py-1 rounded border ${
            likeActive
              ? "bg-green-700 border-green-600"
              : "bg-gray-800 border-gray-700 hover:bg-gray-700"
          }`}
          title="Like"
        >
          👍 {likesCount || 0}
        </button>

        <button
          type="button"
          onClick={handleDislike}
          className={`px-3 py-1 rounded border ${
            dislikeActive
              ? "bg-red-700 border-red-600"
              : "bg-gray-800 border-gray-700 hover:bg-gray-700"
          }`}
          title="Dislike"
        >
          👎 {dislikesCount || 0}
        </button>
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
        className="px-3 py-1 rounded bg-gray-800 border border-gray-700 disabled:opacity-50"
      >
        Prev
      </button>
      <span className="text-sm text-gray-400">
        Page {page} / {totalPages}
      </span>
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="px-3 py-1 rounded bg-gray-800 border border-gray-700 disabled:opacity-50"
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

  return (
    <div className="bg-[#1e1e1e] p-6 rounded-lg">
      {/* composer */}
      <div className="mb-6">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a comment…"
          rows={3}
          className="w-full bg-[#121212] text-gray-200 p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handlePost}
            disabled={!canPost}
            className="px-4 py-2 rounded-lg bg-gray-200 text-black font-medium disabled:opacity-50"
          >
            {posting ? "Posting…" : "Post Comment"}
          </button>
        </div>
      </div>

      {/* list */}
      {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
      {loading ? (
        <div className="space-y-3">
          <div className="h-16 bg-[#151515] rounded-lg animate-pulse" />
          <div className="h-16 bg-[#151515] rounded-lg animate-pulse" />
          <div className="h-16 bg-[#151515] rounded-lg animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-400">No comments yet. Be the first!</p>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((c) => (
              <CommentItem
                key={c._id || c.id || `${c.user}-${c.createdAt}`}
                c={c}
                onReact={handleReact}
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