const { default: axios } = require('axios');
const { myCache } = require("../config")
const crypto = require('crypto');
const { prisma } = require("../util/prisma")
const { getCustomPlaylist } = require("../spotify/playlist");
const jwt = require("jsonwebtoken");
const express = require("express");
const { authenticate } = require('../middleware/auth');
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
authRouter.get("/callback",async(req,res)=>{
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
        myCache.del("code_verifier"+req.ip)
        await saveOrUpdateUser({res,access_token, refresh_token,expires_in:response.data.expires_in});
    })
    .catch(error => {
        console.error("Error fetching tokens 2:", error.data ? error.data : error.message);
        myCache.del("code_verifier"+req.ip)
        res.redirect('/#' +
            new URLSearchParams({
                error: 'token_fetch_failed'
            }).toString()
        );
    });
})

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
    const playlist_id = (await getCustomPlaylist(id,access_token,existingUser.playlistId)).id;
    userDB = await prisma.user.update({
      where: {
        spotify_id: id,
      },
      data: {
        name: display_name,
        playlistId:playlist_id
      },
    });
  } else {
    const playlist_id = (await getCustomPlaylist(id,access_token)).id;
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
    secure: process.env.NODE_ENV == "production",//in production set to "true" 🔒 Only sent over HTTPS 
    sameSite: 'strict',
    path: '/',     // 🛡️ CSRF protection (or 'Lax' for less strict)
    maxAge: 7 * 24  * 60 * 60 * 1000, // 🕒 1 hour
  });
  myCache.set("spotify_access"+userDB.id,access_token,expires_in)
  res.redirect(process.env.FRONTEND_URL)
}
authRouter.delete("/logout",authenticate,async(req,res)=>{
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV == "production", //in production set to "true" 🔒 Only sent over HTTPS 
      sameSite: 'strict',
      path: '/',
    });
    res.sendStatus(204)
})

module.exports = {authRouter}