const jwt = require("jsonwebtoken");

async function authenticate(req, res, next) {
  if(!req.headers.cookie || req.headers.cookie.split("refreshToken=").length < 2) return res.status(401).json({ error: "Unauthorized" });
  const token = req.headers.cookie.split("refreshToken=")[1].split(";")[0];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { authenticate };