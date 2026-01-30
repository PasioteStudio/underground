const { default: axios } = require('axios');
const { myCache, newAxios } = require("../config")
const crypto = require('crypto');
const { prisma } = require("../util/prisma")
const { getCustomPlaylist } = require("../spotify/playlist");
const jwt = require("jsonwebtoken");
const express = require("express")
const authRouter = express()

const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

authRouter.get("/login",async(req,res)=>{
    const codeVerifier = generateRandomString(128);
    myCache.set("code_verifier"+req.ip, codeVerifier, 120);
    const hashed = await sha256(codeVerifier)
    const codeChallenge = base64encode(hashed);
    const scope = 'user-read-private playlist-read-private playlist-modify-public playlist-modify-private playlist-read-collaborative user-library-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: process.env.Client_ID,
            scope: scope,
            redirect_uri: process.env.REDIRECT_URI,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
        }).toString()
    );
})
async function callback(req, res) {
    const code = req.query.code || null;

    axios.post("https://accounts.spotify.com/api/token", {
        code_verifier: myCache.get("code_verifier"+req.ip),
        client_id: process.env.Client_ID,
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code'
      }, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        }
      })
    .then(async (response) => {
        const access_token = response.data.access_token,
            refresh_token = response.data.refresh_token;
        await saveOrUpdateUser({res,access_token, refresh_token,expires_in:response.data.expires_in});
    })
    .catch(error => {
        console.error("Error fetching tokens 2:", error.data ? error.data : error.message);
        res.redirect('/#' +
            new URLSearchParams({
                error: 'token_fetch_failed'
            }).toString()
        );
    });
}
async function getUser(req,res){
  const user = await newAxios.get("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${myCache.get("spotify_access"+req.user.id)}`,
    },
  }).then(response=>{
    return response.data
  });
  const playlist = await newAxios.get(`https://api.spotify.com/v1/playlists/${req.user.playlist_id}`,{
    headers: {
      Authorization: `Bearer ${myCache.get("spotify_access"+req.user.id)}`,
    },
  }).then(response=>{
    return response.data
  })
  const items = await newAxios.get(`https://api.spotify.com/v1/playlists/${req.user.playlist_id}/tracks?fields=next%2Citems%28track%28name%2Cid%2Cartists%28name%2Cid%29%29%29&limit=50&offset=0`,{
    headers: {
      Authorization: `Bearer ${myCache.get("spotify_access"+req.user.id)}`,
    },
  }).then(async(response)=>{
    let allItems = [...response.data.items]
    let counter = 50
    while(response.data.next){
      response = await newAxios.get(`https://api.spotify.com/v1/playlists/${req.user.playlist_id}/tracks?fields=items%28track%28name%2Cid%2Cartists%28name%2Cid%29%29%29&limit=50&offset=${counter}`,{
        
        headers: {
          Authorization: `Bearer ${myCache.get("spotify_access"+req.user.id)}`,
        },})
      allItems = [...allItems,...response.data.items]
    }
    return allItems
  })
  const Newitems = items.map(item=>{
    return {
      name:item.track.name,
      id:item.track.id,
      artists:[
        {
          name:item.track.artists[0].name,
          id:item.track.artists[0].id,
        }
      ]
    }
  })
  res.json({name:user.display_name, playlist:{id:req.user.playlist_id,name:playlist.name,items:Newitems}, id:req.user.spotify_id,genres:req.user.genres})
}
async function saveOrUpdateUser({res,access_token, refresh_token,expires_in}) {
  const user = await axios.get("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
  const { id, display_name } = user.data;
  const existingUser = await prisma.user.findUnique({
    where: {
      spotify_id: id,
    },
  });
  let userDB;
  if (existingUser) {
    userDB = await prisma.user.update({
      where: {
        spotify_id: id,
      },
      data: {
        name: display_name,
      },
    });
  } else {
    const playlist_id = await getCustomPlaylist(id,access_token);
    userDB = await prisma.user.create({
      data: {
        spotify_id: id,
        playlistId: playlist_id,
        name: display_name,
        genres: process.env.GENRES || "indie,rock,pop,alternative,alternative rock,goblincore",
      },
    });
  }
  const token = jwt.sign(
    { id: userDB.id,refresh_token:refresh_token,playlist_id:userDB.playlistId,genres:userDB.genres, spotify_id: userDB.spotify_id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.cookie('refreshToken', token, {
    httpOnly: true,         // 🔐 Not accessible via JavaScript
    secure: false,           //TODO: in production set to "true" 🔒 Only sent over HTTPS 
    sameSite: 'strict',
    path: '/',     // 🛡️ CSRF protection (or 'Lax' for less strict)
    maxAge: 24 * 7  * 60 * 60 * 1000, // 🕒 7 days
  });
  myCache.set("spotify_access"+userDB.id,access_token,expires_in)
  res.redirect(process.env.FRONTEND_URL)
}
/*router.delete("/logout",authenticate, async (req, res) => {
  res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true, //TODO: in production set to "true" 🔒 Only sent over HTTPS 
      sameSite: 'strict',
      path: '/',
    });
    res.sendStatus(204)
});*/

async function authenticate(req, res, next) {
  if(!req.headers.cookie) return res.status(401).json({ error: "Nincs jogosultság" });
  const token = req.headers.cookie.split("refreshToken=")[1].split(";")[0];
  if (!token) return res.status(401).json({ error: "Nincs jogosultság" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Érvénytelen token" });
  }
}

module.exports = { authRouter, callback, authenticate,getUser };