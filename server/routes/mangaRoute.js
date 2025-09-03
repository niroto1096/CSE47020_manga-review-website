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
const upload = require("../middlewares/multer");

const router = express.Router();

router.post("/upload-manga", upload.single("image"), uploadManga);
router.get("/get-all-manga", getAllManga);
router.delete("/delete-manga/:id", deleteManga);
router.put("/update-manga/:id", updateManga);
router.get("/get-manga-by-id/:id", getMangaById);
router.post("/add-rating/:id", addRating);
router.get("/my-rating/:id", getMyRating);
module.exports = router;