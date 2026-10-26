function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  if (req.originalUrl.startsWith("/api/")) {
    return res.status(401).json({
      error: "Unauthorized. Please log in first.",
    });
  }

  return res.redirect("/login");
}

module.exports = ensureAuthenticated;
