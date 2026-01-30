const { myCache } = require("../config")
const axios = require('axios');

async function getToken() {
    if (myCache.get("spotify_token")) {
        return myCache.get("spotify_token");
    }

    const refresh_token = myCache.get("spotify_refresh_token");

    axios.post("https://accounts.spotify.com/api/token",
        {
            grant_type: 'refresh_token',
            refresh_token: refresh_token},
        {
            headers:{
                 'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + (new Buffer.from(process.env.Client_ID + ':' + process.env.Client_Secret).toString('base64'))
            }
        }
    ).then(response => {
        console.log(response.data)
        const access_token = response.data.access_token,
            refresh_token = response.data.refresh_token || refresh_token;
        myCache.set("spotify_token", access_token, response.data.expires_in);
        myCache.set("spotify_refresh_token", refresh_token);
    }).catch(err => {
        console.error("Error fetching token from Spotify API:", err.response ? err.response.data : err.message);
    });
};

module.exports = { getToken };