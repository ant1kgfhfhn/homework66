const bcrypt = require("bcryptjs");
const User = require("../models/User");

function showRegister(req, res) {
  res.render("auth/register");
}

async function register(req, res, next) {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !email.includes("@") || password.length < 6) {
      return res
        .status(400)
        .send(
          'Enter a valid email and a password with at least 6 characters. <a href="/register">Try again</a>',
        );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(409)
        .send('This email is already registered. <a href="/login">Login</a>');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashedPassword,
    });

    res.redirect("/login?registered=1");
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).send("This email is already registered.");
    }

    next(error);
  }
}

function showLogin(req, res) {
  res.render("auth/login", {
    error: req.query.error === "1",
    registered: req.query.registered === "1",
    loggedOut: req.query.loggedOut === "1",
  });
}

function logout(req, res, next) {
  req.logout((error) => {
    if (error) {
      return next(error);
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        return next(sessionError);
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      res.redirect("/login?loggedOut=1");
    });
  });
}

function showProtected(req, res) {
  res.render("auth/profile", {
    email: req.user.email,
  });
}

async function showUsers(req, res, next) {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.render("auth/users", { users });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  showRegister,
  register,
  showLogin,
  logout,
  showProtected,
  showUsers,
};
