const { newAxios } = require("../config");

async function getCustomPlaylist(spotifyId, access_token, playlist_Id) {
    try {
        if (playlist_Id) {
            const res = await newAxios.get(`https://api.spotify.com/v1/playlists/${playlist_Id}`, {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            
            if (res.data.description !== process.env.PLAYLIST_DESCRIPTION || res.data.name !== process.env.PLAYLIST_NAME) {
                await newAxios.put(`https://api.spotify.com/v1/playlists/${playlist_Id}`, {
                    name: process.env.PLAYLIST_NAME || "Ultra Underground Mix",
                    description: process.env.PLAYLIST_DESCRIPTION || ""
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${access_token}`
                    }
                });
                res.data.name = process.env.PLAYLIST_NAME || "Ultra Underground Mix";
                res.data.description = process.env.PLAYLIST_DESCRIPTION || "";
            }
            return res.data;
        }
    } catch (err) {
        // deleted playlist
    }
    
    return await createCustomPlaylist(spotifyId, access_token);
}

async function fetchAllTracksInPlaylist(playlistId, token) {
  const fields = "next%2Citems%28track%28name%2Curi%2Cid%2Cartists%28name%2Cid%29%29%29"
  let allItems = [];
  let offset = 0;
  let hasMore = true;
  
  while(hasMore) {
    const response = await newAxios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=${fields}&limit=50&offset=${offset}`,
      {headers: {Authorization: `Bearer ${token}`}}
    )
    allItems.push(...response.data.items)
    hasMore = !!response.data.next
    offset += 50
  }
  return allItems
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

module.exports = { getCustomPlaylist,fetchAllTracksInPlaylist };