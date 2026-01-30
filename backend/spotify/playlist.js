const { myCache,newAxios } = require("../config")

async function getCustomPlaylist() {
    if(myCache.get("playlist_id")){
        return myCache.get("playlist_id");
    }
    const hasPlaylistID = await newAxios.get("https://api.spotify.com/v1/me/playlists?limit=50&offset=0").then(async response => {
        let potential_id = null
        response.data.items.forEach(playlist => {
            if(playlist.name == (process.env.PLAYLIST_NAME ? process.env.PLAYLIST_NAME : "Ultra Underground Mix"))potential_id = playlist.id;
        })
        return potential_id
        }).catch(err => {
            console.error("Error fetching data from Spotify API:", err.response ? err.response.data : err.message);
            return null
        })
    if(hasPlaylistID){
        myCache.set("playlist_id", hasPlaylistID);
        return hasPlaylistID;
    } 
    const id = await newAxios.get("https://api.spotify.com/v1/me").then(response => {
        return response.data.id;
    }).catch(err => {
        console.error("Error fetching data from Spotify API:", err.response ? err.response.data : err.message);
        return null;
    });
    const playlistId = await newAxios.post(`https://api.spotify.com/v1/users/${id}/playlists`, {
        name: process.env.PLAYLIST_NAME || "Ultra Underground Mix",
        description: "Made by your Atemzy",
        public: false
    }).then(response => {
        return response.data.id;
    }).catch(err => {
        console.error("Error fetching data from Spotify API:", err.response ? err.response.data : err.message);
        return null;
    });
    myCache.set("playlist_id", playlistId);
    return playlistId;
}

module.exports = { getCustomPlaylist };