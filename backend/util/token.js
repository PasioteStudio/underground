const axios = require('axios');
const {myCache} = require("../config")
const jwt = require("jsonwebtoken");

async function getToken(req,res) {
    if (!req.user || !req.user.refresh_token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('refresh_token', req.user.refresh_token);
      params.append('client_id', process.env.Client_ID);

      const headers = { 'content-type': 'application/x-www-form-urlencoded' };
        headers['Authorization'] = 'Basic ' + Buffer.from(process.env.Client_ID + ':' + process.env.Client_Secret).toString('base64');

      const response = await axios.post("https://accounts.spotify.com/api/token", params.toString(), { headers });
      const access_token = response.data.access_token,
            refresh_token2 = response.data.refresh_token || req.user.refresh_token;
      myCache.set("spotify_access"+req.user.id,access_token,response.data.expires_in)
      const token = jwt.sign(
          { id: req.user.id,refresh_token:refresh_token2,playlist_id:req.user.playlist_id,genres:req.user.genres, spotify_id: req.user.spotify_id },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
      res.cookie('refreshToken', token, {
          httpOnly: true,         // 🔐 Not accessible via JavaScript
          secure: process.env.NODE_ENV == "production",//in production set to "true" 🔒 Only sent over HTTPS 
          sameSite: 'strict',
          path: '/',     // 🛡️ CSRF protection (or 'Lax' for less strict)
          maxAge: 7 * 24  * 60 * 60 * 1000, // 🕒 1 hour
      });
      res.json({access_token:access_token,expires_in:response.data.expires_in})
    } catch (err) {
      console.error("Error fetching token from Spotify API (refresh_token):", err.response ? err.response.status : '', err.response ? err.response.data : err.message);
      // If refresh is invalid (400/401), clear refresh cookie to force re-login
      if (err.response && (err.response.status === 400 || err.response.status === 401)) {
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV == "production",
          sameSite: 'strict',
          path: '/',
        });
      }
      res.sendStatus(401)
    };
};

module.exports = { getToken };