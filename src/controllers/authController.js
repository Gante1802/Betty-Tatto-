const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcryptjs");

const { createToken } = require("../services/tokenService");
const { usersCollection } = require("../database/collections");

const usersSeedPath = path.join(__dirname, "../../data/users.json");
const SALT_ROUNDS = Number(process.env.AUTH_SALT_ROUNDS || 10);
const COOKIE_MAX_AGE_SECONDS = Number(process.env.AUTH_COOKIE_MAX_AGE || 86400);

let seedPromise;

async function readLegacyUsers() {
  try {
    const raw = await fs.readFile(usersSeedPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function setAuthCookie(res, token) {
  res.cookie("bettyAuthToken", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_SECONDS * 1000,
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.clearCookie("bettyAuthToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function buildAuthResponse(user, token) {
  return {
    token,
    user: {
      id: String(user._id),
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    },
  };
}

async function seedLegacyUsersIfNeeded() {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    const users = usersCollection();
    const hasUsers = await users.findOne({}, { projection: { _id: 1 } });

    if (hasUsers) {
      return;
    }

    const legacyUsers = await readLegacyUsers();

    if (!legacyUsers.length) {
      return;
    }

    const docs = await Promise.all(
      legacyUsers.map(async (legacyUser) => ({
        username: String(legacyUser.username || "").trim(),
        usernameNormalized: normalizeUsername(legacyUser.username),
        displayName: String(legacyUser.displayName || legacyUser.username || "").trim(),
        role: legacyUser.role === "admin" ? "admin" : "user",
        passwordHash: await bcrypt.hash(String(legacyUser.password || ""), SALT_ROUNDS),
        createdAt: legacyUser.createdAt || new Date().toISOString(),
      })),
    );

    if (docs.length > 0) {
      await users.insertMany(docs, { ordered: false });
    }
  })().catch((error) => {
    seedPromise = null;
    throw error;
  });

  return seedPromise;
}

async function login(req, res, next) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Usuario y password son obligatorios." });
  }

  try {
    await seedLegacyUsersIfNeeded();

    const normalizedUsername = normalizeUsername(username);
    const users = usersCollection();

    const matchedUser = await users.findOne({
      usernameNormalized: normalizedUsername,
    });

    if (!matchedUser) {
      return res.status(401).json({ error: "Credenciales invalidas." });
    }

    const passwordMatches = await bcrypt.compare(
      String(password),
      matchedUser.passwordHash || "",
    );

    if (!passwordMatches) {
      return res.status(401).json({ error: "Credenciales invalidas." });
    }

    const token = createToken({
      id: String(matchedUser._id),
      username: matchedUser.username,
      role: matchedUser.role,
      displayName: matchedUser.displayName,
    });

    setAuthCookie(res, token);
    return res.status(200).json(buildAuthResponse(matchedUser, token));
  } catch (error) {
    return next(error);
  }
}

async function register(req, res, next) {
  const { username, password, displayName } = req.body;

  if (!username || !password || !displayName) {
    return res
      .status(400)
      .json({ error: "Usuario, nombre y password son obligatorios." });
  }

  if (String(password).length < 6) {
    return res
      .status(400)
      .json({ error: "El password debe tener minimo 6 caracteres." });
  }

  try {
    await seedLegacyUsersIfNeeded();

    const users = usersCollection();
    const normalizedUsername = normalizeUsername(username);

    const exists = await users.findOne({ usernameNormalized: normalizedUsername });

    if (exists) {
      return res.status(409).json({ error: "Ese usuario ya existe." });
    }

    const passwordHash = await bcrypt.hash(String(password), SALT_ROUNDS);

    const newUser = {
      username: String(username).trim(),
      usernameNormalized: normalizedUsername,
      passwordHash,
      role: "user",
      displayName: String(displayName).trim(),
      createdAt: new Date().toISOString(),
    };

    const result = await users.insertOne(newUser);
    newUser._id = result.insertedId;

    const token = createToken({
      id: String(newUser._id),
      username: newUser.username,
      role: newUser.role,
      displayName: newUser.displayName,
    });

    setAuthCookie(res, token);
    return res.status(201).json(buildAuthResponse(newUser, token));
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.status(200).json({ user: req.user });
}

function logout(req, res) {
  clearAuthCookie(res);
  return res.status(204).send();
}

module.exports = {
  login,
  register,
  me,
  logout,
};
