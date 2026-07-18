const { verifyToken } = require("../services/tokenService");

function getBearerToken(req) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim();
}

function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "No autorizado." });
    }

    const user = verifyToken(token);
    req.user = user;

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalido o expirado." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Acceso solo para administradores." });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};
