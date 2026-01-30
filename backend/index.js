const express = require('express');
require('dotenv').config();
const { authRouter, callback,authenticate, getUser } = require("./middleware/auth");
const { getToken } = require("./middleware/token");
const { myCache,newAxios } = require("./config")
const axios = require('axios');
const cors = require("cors")

const PORT = process.env.PORT | 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.enable('trust proxy')

app.use(cors({
    origin:[process.env.FRONTEND_URL],
    credentials:true,
    exposedHeaders: ['Set-Cookie']
}))

app.use("/", authRouter);
app.use("/callback", callback);
app.use("/token",authenticate ,getToken);

app.get('/user', authenticate, async (req, res) => {
    await getUser(req,res)
})
app.get('/user/test', authenticate, async (req, res) => {
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

app.get('/user/play', authenticate, async (req, res) => {
    
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});