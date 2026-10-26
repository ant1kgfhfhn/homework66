require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

const connectDatabase = require("./config/database");
const configurePassport = require("./config/passport");
const authRoutes = require("./routes/authRoutes");
const userApiRoutes = require("./routes/userApiRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "..", "views"));

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/styles", express.static(path.join(__dirname, "..", "views")));

app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.render("auth/home", {
    isAuthenticated: req.isAuthenticated(),
  });
});

app.use("/", authRoutes);
app.use("/api/users", userApiRoutes);

app.use((req, res) => {
  res.status(404).send("Page not found.");
});

app.use((err, req, res, next) => {
  console.error("Application error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: "Internal Server Error",
  });
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
      throw new Error("Missing MONGODB_URI or SESSION_SECRET in .env");
    }

    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
