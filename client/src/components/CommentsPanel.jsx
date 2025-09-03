import React, { useEffect, useMemo, useState } from "react";
import { getCommentsApi, addCommentApi, reactCommentApi } from "@/Api/mangaApi";

const PAGE_SIZE = 20;

function getUserId() {
  return localStorage.getItem("userId") || "";
}

// ---- helpers to read/modify reaction state across server shapes ----
function getLikeState(comment, userId) {
  const reactors = comment?.reactors || comment?.reactions || [];
  const countFromArray = Array.isArray(reactors) ? reactors.length : undefined;

  const count =
    comment?.reactionsCount ?? comment?.likes ?? countFromArray ?? 0;

  const userLiked =
    comment?.userLiked ??
    (Array.isArray(reactors) ? reactors.includes(userId) : false);

  return { count, userLiked };
}

function toggleLocalReaction(comment, userId) {
  // clone shallow
  const c = { ...comment };

  // Normalize to reactors[] internally for optimistic update
  let reactors = Array.isArray(c.reactors)
    ? [...c.reactors]
    : Array.isArray(c.reactions)
    ? [...c.reactions]
    : undefined;

  const hadArray = Array.isArray(reactors);

  if (!hadArray) {
    // if server uses counts only, synthesize array virtually
    const { userLiked } = getLikeState(c, userId);
    reactors = userLiked ? [userId] : [];
  }

  if (reactors.includes(userId)) {
    reactors = reactors.filter((u) => u !== userId);
  } else {
    reactors.push(userId);
  }

  // Write back in both styles so UI stays consistent
  c.reactors = reactors;
  c.reactions = reactors;

  const { count, userLiked } = getLikeState(c, userId);
  c.reactionsCount = count;
  c.userLiked = userLiked;

  return c;
}

// ---- UI components ----
const CommentItem = ({ c, onReact, currentUserId }) => {
  const author =
    c?.user?.name ||
    c?.user?.username ||
    (typeof c?.user === "string" ? c.user : c?.user?._id) ||
    "Anonymous";

  const when = c?.createdAt ? new Date(c.createdAt).toLocaleString() : "";
  const { count, userLiked } = getLikeState(c, currentUserId);

  return (
    <div className="border border-gray-700 rounded-lg p-3 bg-[#171717]">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="truncate max-w-[70%]">@{author}</span>
        <span>{when}</span>
      </div>

      <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">
        {c?.text || c?.comment}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => onReact(c)}
          className={`px-3 py-1 rounded border text-sm ${
            userLiked
              ? "bg-gray-200 text-black border-gray-300"
              : "bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
          }`}
        >
          {userLiked ? "Unlike" : "Like"}
        </button>
        <span className="text-xs text-gray-400">
          {count} like{count === 1 ? "" : "s"}
        </span>
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

const CommentsPanel = ({ mangaId }) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const currentUserId = getUserId();

  const canPost = useMemo(
    () => draft.trim().length > 0 && !posting,
    [draft, posting]
  );

  const load = async (toPage = page) => {
    setLoading(true);
    setErr("");
    try {
      const { data, headers } = await getCommentsApi(mangaId, toPage, limit);
      const comments =
        data?.comments || data?.data || data?.items || data || [];
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
  }, [mangaId]);

  const handlePost = async () => {
    if (!canPost) return;
    const text = draft.trim();
    const userId = currentUserId;
    if (!userId) {
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
      user: userId,
      createdAt: new Date().toISOString(),
      reactors: [], // start with 0 likes
      reactionsCount: 0,
      userLiked: false,
      __optimistic: true,
    };
    setItems((prev) => [temp, ...prev]);
    setDraft("");

    try {
      await addCommentApi(mangaId, text, userId);
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

  const handleReact = async (comment) => {
    const userId = currentUserId;
    if (!userId) {
      setErr("Please log in to react.");
      return;
    }

    // optimistic flip
    const before = items;
    const after = items.map((c) =>
      (c._id || c.id) === (comment._id || comment.id)
        ? toggleLocalReaction(c, userId)
        : c
    );
    setItems(after);

    try {
      await reactCommentApi(comment._id || comment.id, userId);
      // Optional: refresh this page to sync with server truth
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
