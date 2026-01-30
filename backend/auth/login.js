const { default: axios } = require('axios');
const { myCache } = require("../config")
const crypto = require('crypto');

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

async function login(req, res) {
    const codeVerifier = generateRandomString(128);
    myCache.set("code_verifier", codeVerifier, 300);
    const hashed = await sha256(codeVerifier)
    const codeChallenge = base64encode(hashed);
    const scope = 'user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private playlist-read-collaborative user-library-read';
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
}
async function callback(req, res) {
    const code = req.query.code || null;

    axios.post("https://accounts.spotify.com/api/token", {
        code_verifier: myCache.get("code_verifier"),
        client_id: process.env.Client_ID,
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code'
      }, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        }
      })
    .then(response => {
        const access_token = response.data.access_token,
            refresh_token = response.data.refresh_token;
        myCache.set("spotify_token", access_token, response.data.expires_in);
        myCache.set("spotify_refresh_token", refresh_token);
        res.redirect("/token");

    })
    .catch(error => {
        console.error("Error fetching tokens:", error.data ? error.data : error.message);
        res.redirect('/#' +
            new URLSearchParams({
                error: 'token_fetch_failed'
            }).toString()
        );
    });
}

module.exports = { login, callback };