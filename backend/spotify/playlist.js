const { newAxios } = require("../config");

async function getCustomPlaylist(spotifyId,access_token,playlist_Id) {
    let Playlist;
    if(playlist_Id){
        await newAxios.get(`https://api.spotify.com/v1/playlists/${playlist_Id}`,{
            headers: {
                Authorization: `Bearer ${access_token}`,
            }
        }).then(async(res)=>{
            if(res.data.description != process.env.PLAYLIST_DESCRIPTION || res.data.name != process.env.PLAYLIST_NAME){
                await newAxios.put(`https://api.spotify.com/v1/playlists/${playlist_Id}`,{
                    name: process.env.PLAYLIST_NAME || "Ultra Underground Mix",
                    description: process.env.PLAYLIST_DESCRIPTION || "",
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${access_token}`,
                    }
                })
                res.data.name = process.env.PLAYLIST_NAME || "Ultra Underground Mix"
                res.data.description = process.env.PLAYLIST_DESCRIPTION || ""
                Playlist = res.data
            }else{
                Playlist = res.data
            }
        }).catch(async(err)=>{
            //deleted playlist
            Playlist = await createCustomPlaylist(spotifyId,access_token)
        })
    }else{
        Playlist = await createCustomPlaylist(spotifyId,access_token)
    }
    return Playlist;
}

async function createCustomPlaylist(spotifyId,access_token) {
    newPlaylist = await newAxios.post(`https://api.spotify.com/v1/users/${spotifyId}/playlists`, {
        name: process.env.PLAYLIST_NAME || "Ultra Underground Mix",
        description: process.env.PLAYLIST_DESCRIPTION || "",
        public: false
    }, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        }
    }).then(response => {
        return response.data;
    }).catch(err => {
        console.error("Error fetching data (create) from Spotify API:", err.response ? err.response.data : err.message);
        return null;
    });
    return newPlaylist
}

module.exports = { getCustomPlaylist };