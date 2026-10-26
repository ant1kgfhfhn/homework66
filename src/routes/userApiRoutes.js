const express = require("express");
const ensureAuthenticated = require("../middlewares/authMiddleware");

const {
  findUsers,
  insertOne,
  insertMany,
  updateOne,
  updateMany,
  replaceOne,
  deleteOne,
  deleteMany,
} = require("../controllers/userApiController");

const router = express.Router();

// Все API-маршруты требуют авторизации
router.use(ensureAuthenticated);

router.get("/", findUsers);

router.post("/bulk", insertMany);
router.post("/", insertOne);

router.patch("/bulk/update", updateMany);
router.patch("/:id", updateOne);

router.put("/:id/replace", replaceOne);

router.delete("/bulk", deleteMany);
router.delete("/:id", deleteOne);

module.exports = router;
