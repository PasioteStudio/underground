const { default: axios } = require("axios");

async function getCustomPlaylist(spotifyId,access_token) {
    const playlistId = await axios.post(`https://api.spotify.com/v1/users/${spotifyId}/playlists`, {
        name: process.env.PLAYLIST_NAME || "Ultra Underground Mix",
        description: "Made by your Atemzy",
        public: false
    }, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    }).then(response => {
        return response.data.id;
    }).catch(err => {
        console.error("Error fetching data from Spotify API:", err.response ? err.response.data : err.message);
        return null;
    });
    return playlistId;
}

module.exports = { getCustomPlaylist };