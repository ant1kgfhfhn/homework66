const express = require("express");
const passport = require("passport");

const {
  showRegister,
  register,
  showLogin,
  logout,
  showProtected,
  showUsers,
} = require("../controllers/authController");
const userApiController = require("../controllers/userApiController");
const ensureAuthenticated = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/register", showRegister);
router.post("/register", register);
router.get("/login", showLogin);

router.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login?error=1" }),
  (req, res) => res.redirect("/protected"),
);

router.post("/logout", logout);
router.get("/protected", ensureAuthenticated, showProtected);
router.get("/users", ensureAuthenticated, showUsers);

// JSON CRUD API. All endpoints require a logged-in user.
router.use("/api/users", ensureAuthenticated);
router.get("/api/users", userApiController.findUsers);
router.post("/api/users", userApiController.insertOne);
router.post("/api/users/bulk", userApiController.insertMany);
router.patch("/api/users/bulk/update", userApiController.updateMany);
router.delete("/api/users/bulk", userApiController.deleteMany);
router.patch("/api/users/:id", userApiController.updateOne);
router.put("/api/users/:id/replace", userApiController.replaceOne);
router.delete("/api/users/:id", userApiController.deleteOne);

module.exports = router;
