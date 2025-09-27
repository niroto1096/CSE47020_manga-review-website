// Simple XP/Level utility
// Rules:
// - Award XP per action (e.g., new review)
// - Level up when XP >= threshold(level)
// - Threshold: 100 * currentLevel (configurable)

const XP_PER_REVIEW = 50; // first review on a manga
const XP_PER_COMMENT = 10; // per comment
const XP_PER_REVIEW_LIKE_RECEIVED = 5; // when someone likes your review
const XP_PER_FOLLOW_GAINED = 20; // when someone follows you
const BASE_THRESHOLD = 100; // xp needed for level 1 -> 2

function getLevelThreshold(level) {
  // Example progression: linear increase
  return BASE_THRESHOLD * level; // e.g., L1->2:100, L2->3:200, L3->4:300, ...
}

function addXp(user, xpToAdd) {
  if (!user) return { leveledUp: false, newLevel: 0, newXp: 0 };
  user.xp = (user.xp || 0) + xpToAdd;
  user.totalXp = (user.totalXp || 0) + xpToAdd;
  let leveledUp = false;
  // handle multi-level ups if XP is large
  while ((user.xp || 0) >= getLevelThreshold(user.level || 1)) {
    user.xp -= getLevelThreshold(user.level || 1);
    user.level = (user.level || 1) + 1;
    leveledUp = true;
  }
  return { leveledUp, newLevel: user.level, newXp: user.xp };
}

module.exports = {
  XP_PER_REVIEW,
  XP_PER_COMMENT,
  XP_PER_REVIEW_LIKE_RECEIVED,
  XP_PER_FOLLOW_GAINED,
  getLevelThreshold,
  addXp,
};
