const axios = require('axios');
const {myCache} = require("../config")

async function getToken(req,res) {
    console.log(req.user.refresh_token)
    axios.post("https://accounts.spotify.com/api/token",
        {
            grant_type: 'refresh_token',
            refresh_token: req.user.refresh_token,
            client_id:process.env.Client_ID
        },
        {
            headers:{
                 'content-type': 'application/x-www-form-urlencoded',
            }
        }
    ).then(response => {
        const access_token = response.data.access_token,
            refresh_token2 = response.data.refresh_token;
        myCache.set("spotify_access"+req.user.id,access_token,response.data.expires_in)
        res.cookie('refreshToken', refresh_token2, {
            httpOnly: true,         // 🔐 Not accessible via JavaScript
            secure: false,           //TODO: in production set to "true" 🔒 Only sent over HTTPS 
            sameSite: 'strict',
            path: '/',     // 🛡️ CSRF protection (or 'Lax' for less strict)
            maxAge: 24 * 7  * 60 * 60 * 1000, // 🕒 7 days
        });
        res.json({access_token:access_token,expires_in:response.data.expires_in})
    }).catch(err => {
        console.error(err.status,"Error fetching token from Spotify API:", err.response ? err.response.data : err.message);
        res.status(500).json("Gatya")
    });
};

module.exports = { getToken };