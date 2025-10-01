// Simple XP/Level utility
// Rules:
// - Award XP per action (e.g., new review)
// - Level up when XP >= threshold(level)
// - Threshold: 100 * currentLevel (configurable)

const XP_PER_REVIEW = 50; // first review on a manga
const XP_PER_COMMENT = 10; // per comment
const XP_PER_REVIEW_LIKE_RECEIVED = 5; // when someone likes your review
const XP_PER_FOLLOW_GAINED = 20; // when someone follows you
const DAILY_XP_CAP = 200; // max xp per user per day
const DAILY_COMMENT_LIMIT = 15; // max comments per day for XP
const DAILY_REVIEW_LIMIT = 5; // max reviews per day for XP
const BASE_THRESHOLD = 100; // xp needed for level 1 -> 2

function getLevelThreshold(level) {
  // Example progression: linear increase
  return BASE_THRESHOLD * level; // e.g., L1->2:100, L2->3:200, L3->4:300, ...
}

function addXp(user, xpToAdd) {
  if (!user) return { awarded: 0, capped: false, leveledUp: false, newLevel: 0, newXp: 0 };

  // daily cap handling (UTC-based day)
  const now = new Date();
  const dayKey = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!user.xpDayDate || new Date(user.xpDayDate).getTime() !== dayKey) {
    user.xpDayDate = new Date(dayKey);
    user.xpDay = 0;
    user.dailyComments = 0;
    user.dailyReviews = 0;
  }
  const remaining = Math.max(0, DAILY_XP_CAP - (user.xpDay || 0));
  const grant = Math.max(0, Math.min(remaining, xpToAdd));
  const capped = grant < xpToAdd;

  user.xp = (user.xp || 0) + grant;
  user.totalXp = (user.totalXp || 0) + grant;
  user.xpDay = (user.xpDay || 0) + grant;
  let leveledUp = false;
  // handle multi-level ups if XP is large
  while ((user.xp || 0) >= getLevelThreshold(user.level || 1)) {
    user.xp -= getLevelThreshold(user.level || 1);
    user.level = (user.level || 1) + 1;
    leveledUp = true;
  }
  return { awarded: grant, capped, leveledUp, newLevel: user.level, newXp: user.xp };
}

module.exports = {
  XP_PER_REVIEW,
  XP_PER_COMMENT,
  XP_PER_REVIEW_LIKE_RECEIVED,
  XP_PER_FOLLOW_GAINED,
  DAILY_XP_CAP,
  DAILY_COMMENT_LIMIT,
  DAILY_REVIEW_LIMIT,
  getLevelThreshold,
  addXp,
};
