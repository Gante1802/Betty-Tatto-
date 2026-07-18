const { createToken } = require("../services/tokenService");

const users = [
  {
    id: "u1",
    username: process.env.DEMO_USER_USERNAME || "cliente",
    password: process.env.DEMO_USER_PASSWORD || "cliente123",
    role: "user",
    displayName: "Cliente",
  },
  {
    id: "a1",
    username: process.env.ADMIN_USERNAME || "bettyadmin",
    password: process.env.ADMIN_PASSWORD || "betty123",
    role: "admin",
    displayName: "Betty",
  },
];

function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Usuario y password son obligatorios." });
  }

  const normalizedUsername = String(username).trim().toLowerCase();

  const matchedUser = users.find(
    (user) =>
      user.username.toLowerCase() === normalizedUsername &&
      user.password === String(password),
  );

  if (!matchedUser) {
    return res.status(401).json({ error: "Credenciales invalidas." });
  }

  const token = createToken({
    id: matchedUser.id,
    username: matchedUser.username,
    role: matchedUser.role,
    displayName: matchedUser.displayName,
  });

  res.setHeader(
    "Set-Cookie",
    `bettyAuthToken=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  );

  return res.status(200).json({
    token,
    user: {
      id: matchedUser.id,
      username: matchedUser.username,
      role: matchedUser.role,
      displayName: matchedUser.displayName,
    },
  });
}

function me(req, res) {
  return res.status(200).json({ user: req.user });
}

module.exports = {
  login,
  me,
};
