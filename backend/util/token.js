const axios = require('axios');
const {myCache} = require("../config")
const jwt = require("jsonwebtoken");

async function getToken(req,res) {
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
    }).catch(err => {
        if(err.status != 500){
            console.error(err.status,"Error fetching token from Spotify API:", err.response ? err.response.data : err.message);
        }
        res.sendStatus(401)
    });
};

module.exports = { getToken };