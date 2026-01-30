const express = require('express');
require('dotenv').config();
const { login, callback } = require("./auth/login");
const { myCache,newAxios } = require("./config")
const { getCustomPlaylist } = require("./spotify/playlist");
const axios = require('axios');

const PORT = process.env.PORT | 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/login", login);
app.use("/callback", callback);

const genres = process.env.GENRES ? process.env.GENRES.split(",") : ["indie","rock","pop","alternative","alternative rock","goblincore"];

app.get('/token', async (req, res) => {
    newAxios.get("https://api.spotify.com/v1/search?q=Underground%2520Indie%2520Mix&type=playlist&offset=0").then(response => {
        console.log(response.data)
        res.json(response.data);
    }).catch(err => {
        console.error("Error fetching data from Spotify API:", err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Failed to fetch data from Spotify API' });
    });
})
app.get('/play', async (req, res) => {
    const word = await axios.get("https://random-word-api.herokuapp.com/word?number=1").then(response=>response.data[0])
    const playlistId = await getCustomPlaylist()
    const items = await newAxios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=items%28track%28id%29%29&limit=50&offset=0`).then(response=>{
        return response.data.items.map(item=>item.track.id)
    })
    const to_be_added = []
    for(let i =0;i<genres.length;i++){
        await newAxios.get(`https://api.spotify.com/v1/search?q=${word}%20genre%3A${genres[i]}%20tag%3Ahipster&type=track&limit=10&offset=0`).then(async (response) => {
            for(let x = 0;x<response.data.tracks.items.length;x++){
                const item = response.data.tracks.items[x];
                await newAxios.get(`https://api.spotify.com/v1/tracks/${item.id}`).then(async (res)=>{
                    if(res.data.popularity == 0 && !items.includes(res.data.id)) to_be_added.push(res.data.uri)
                })
            }
        }).catch(err => {
            console.error("Error fetching data from Spotify API:", err.response ? err.response.data : err.message);
        });
    }
    if(to_be_added.length == 0){
        return res.json({message: "No new tracks to add"});
    }else if(to_be_added.length > 100){
        const first_batch = to_be_added.slice(0,100);
        const second_batch = to_be_added.slice(100);
        await newAxios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,{
            uris: first_batch,
        }).then(result=>{
            res.json({message: "Tracks added to playlist successfully"});
        }).catch(err=>{
            console.error("Error adding tracks to playlist:", err.response ? err.response.data : err.message);
            res.status(500).json({ error: 'Failed to add tracks to playlist' });
        })
        await newAxios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,{
            uris: second_batch,
        }).then(result=>{
            res.json({message: "Tracks added to playlist successfully"});
        }).catch(err=>{
            console.error("Error adding tracks to playlist:", err.response ? err.response.data : err.message);
            res.status(500).json({ error: 'Failed to add tracks to playlist' });
        })
        return;
    }
    await newAxios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,{
        uris: to_be_added,
    }).then(result=>{
        res.json({message: "Tracks added to playlist successfully"});
    }).catch(err=>{
        console.error("Error adding tracks to playlist:", err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Failed to add tracks to playlist' });
    })
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});