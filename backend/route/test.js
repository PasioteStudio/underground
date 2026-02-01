const { myCache, newAxios } = require("../config")
const express = require("express");
const { authenticate } = require("../middleware/auth");
const testRouter = express()

testRouter.use("/",authenticate)

testRouter.get('/', async (req, res) => {
    newAxios.get("https://api.spotify.com/v1/search?q=Underground%2520Indie%2520Mix&type=playlist&offset=0",{
        headers:{
            Authorization: `Bearer ${myCache.get("spotify_access"+req.user.id)}`
        }
    }).then(response => {
        console.log(response.data)
        res.json(response.data);
    }).catch(err => {
        console.error("Error fetching data from Spotify API:", err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Failed to fetch data from Spotify API' });
    });
})

module.exports = {testRouter}