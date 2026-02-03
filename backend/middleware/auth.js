const jwt = require("jsonwebtoken");

async function authenticate(req, res, next) {
  const token = req.cookies && req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Clear invalid cookie to force re-authentication
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV == "production",
      sameSite: 'strict',
      path: '/',
    });
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { authenticate };