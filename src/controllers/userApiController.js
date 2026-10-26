const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const users = User.collection;

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function validEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function publicUser(user) {
  if (!user) return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

// GET /api/users — find() and projection
async function findUsers(req, res, next) {
  try {
    let projection;

    if (req.query.fields === "email") {
      projection = {
        _id: 1,
        email: 1,
        createdAt: 1,
      };
    } else {
      projection = {
        password: 0,
      };
    }

    const result = await users
      .find({}, { projection })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(result);
  } catch (error) {
    next(error);
  }
}

// POST /api/users — insertOne
async function insertOne(req, res, next) {
  try {
    const { email, password } = req.body;

    if (
      !validEmail(email) ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        error: "Provide a valid email and a password of at least 6 characters.",
      });
    }

    const document = {
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(document);

    res.status(201).json({
      message: "User created",
      user: publicUser({ _id: result.insertedId, ...document }),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already exists." });
    }
    next(error);
  }
}

// POST /api/users/bulk — insertMany
async function insertMany(req, res, next) {
  try {
    const { users: inputUsers } = req.body;

    if (!Array.isArray(inputUsers) || inputUsers.length === 0) {
      return res.status(400).json({
        error: "Send a non-empty users array.",
      });
    }

    if (
      inputUsers.some(
        (user) =>
          !validEmail(user.email) ||
          typeof user.password !== "string" ||
          user.password.length < 6,
      )
    ) {
      return res.status(400).json({
        error:
          "Every user needs a valid email and a password of at least 6 characters.",
      });
    }

    const now = new Date();

    const documents = await Promise.all(
      inputUsers.map(async (user) => ({
        email: user.email.trim().toLowerCase(),
        password: await bcrypt.hash(user.password, 10),
        createdAt: now,
        updatedAt: now,
      })),
    );

    const result = await users.insertMany(documents, { ordered: true });

    res.status(201).json({
      message: "Users created",
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "An email already exists." });
    }
    next(error);
  }
}

// PATCH /api/users/:id — updateOne
async function updateOne(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    const { email } = req.body;

    if (!validEmail(email)) {
      return res.status(400).json({ error: "Provide a valid email." });
    }

    const result = await users.updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      {
        $set: {
          email: email.trim().toLowerCase(),
          updatedAt: new Date(),
        },
      },
    );

    res.json({
      message: result.matchedCount ? "Update completed" : "User not found",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already exists." });
    }
    next(error);
  }
}

// PATCH /api/users/bulk/update — updateMany
async function updateMany(req, res, next) {
  try {
    const { filter, email } = req.body;

    if (!filter || typeof filter.email !== "string" || !validEmail(email)) {
      return res.status(400).json({
        error: "Provide filter.email and a valid new email.",
      });
    }

    const result = await users.updateMany(
      { email: filter.email.trim().toLowerCase() },
      {
        $set: {
          email: email.trim().toLowerCase(),
          updatedAt: new Date(),
        },
      },
    );

    res.json({
      message: "Bulk update completed",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already exists." });
    }
    next(error);
  }
}

// PUT /api/users/:id/replace — replaceOne
async function replaceOne(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    const { email, password } = req.body;

    if (
      !validEmail(email) ||
      typeof password !== "string" ||
      password.length < 6
    ) {
      return res.status(400).json({
        error: "Provide a valid email and a password of at least 6 characters.",
      });
    }

    const replacement = {
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.replaceOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      replacement,
    );

    res.json({
      message: result.matchedCount ? "Replacement completed" : "User not found",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already exists." });
    }
    next(error);
  }
}

// DELETE /api/users/:id — deleteOne
async function deleteOne(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    const result = await users.deleteOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
    });

    res.json({
      message: result.deletedCount ? "User deleted" : "User not found",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/users/bulk — deleteMany
async function deleteMany(req, res, next) {
  try {
    const { filter } = req.body;

    if (
      !filter ||
      typeof filter.email !== "string" ||
      !validEmail(filter.email)
    ) {
      return res.status(400).json({
        error:
          "Provide a valid filter.email to prevent accidental mass deletion.",
      });
    }

    const result = await users.deleteMany({
      email: filter.email.trim().toLowerCase(),
    });

    res.json({
      message: "Bulk delete completed",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  findUsers,
  insertOne,
  insertMany,
  updateOne,
  updateMany,
  replaceOne,
  deleteOne,
  deleteMany,
};
