const express = require("express");
const {
  uploadManga,
  getAllManga,
  deleteManga,
  updateManga,
  getMangaById,
  addRating,
  getMyRating,
} = require("../controllers/mangaController");
const {
  addComment,
  listComments,
  toggleReaction,
  editComment,
} = require("../controllers/commentController");
const upload = require("../middlewares/multer");
const {
  updatePersonalList,
  getStatus,
  getList,
} = require("../controllers/pListController");
const {
  createOrUpdateReview,
  getUserReview,
  getMangaReviews,
  deleteReview,
  toggleReviewReaction,
  getReviewSummary,
  testEmail,
} = require("../controllers/reviewController");

const router = express.Router();

router.post("/upload-manga", upload.single("image"), uploadManga);
router.get("/get-all-manga", getAllManga);
router.delete("/delete-manga/:id", deleteManga);
router.put("/update-manga/:id", updateManga);
router.get("/get-manga-by-id/:id", getMangaById);
router.post("/add-rating/:id", addRating);
router.get("/my-rating/:id", getMyRating);
router.post("/add-comment", addComment);
// list comments: GET /comments?mangaId=...
router.get("/comments", listComments);
router.post("/personal-list/update", updatePersonalList);
router.get("/personal-list/status", getStatus);
router.get("/personal-list", getList);

// toggle like: POST /comments/:id/react
router.post("/comments/:id/react", toggleReaction);
// edit comment: PUT /comments/:id
router.put("/comments/:id", editComment);

// Review routes
router.post("/reviews", createOrUpdateReview);
router.get("/reviews/user", getUserReview);
router.get("/reviews", getMangaReviews);
router.delete("/reviews/:id", deleteReview);
// Review reactions
router.post("/reviews/:id/react", toggleReviewReaction);
// Review summary (avg and count)
router.get("/reviews/summary", getReviewSummary);
// Test email functionality
router.post("/test-email", testEmail);

module.exports = router;
