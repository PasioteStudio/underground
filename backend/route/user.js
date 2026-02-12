const { myCache, newAxios } = require("../config")
const express = require("express");
const { getToken } = require("../util/token");
const { authenticate } = require("../middleware/auth");
const { prisma } = require("../util/prisma");
const { getCustomPlaylist,fetchAllTracksInPlaylist } = require("../spotify/playlist");
const jwt = require("jsonwebtoken");

const userRouter = express()

userRouter.use("/",authenticate)

userRouter.patch("/genres",async(req,res)=>{
  if(!req.body.genres || req.body.genres.length < 1 || !Array.isArray(req.body.genres)){
    res.status(400).json("Wrong genres!")
    return
  }
  await prisma.user.update({
    where:{id:Number.parseInt(req.user.id)},
    data:{
      genres:req.body.genres.join(",")
    }
  })
  const token = jwt.sign(
    { id: req.user.id,refresh_token:req.user.refresh_token,playlist_id:req.user.playlist_id,genres:req.body.genres.join(","), spotify_id: req.user.spotify_id },
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
  myCache.del("user_"+req.user.id)
  res.json("Genres updated!")
})

userRouter.get("/",async(req,res)=>{
  if(myCache.has("user_"+req.user.id)){
      return res.json(myCache.get("user_"+req.user.id))
  }
  const spotifyToken = myCache.get("spotify_access"+req.user.id)
  const [userDB, user] = await Promise.all([
    prisma.user.findUnique({where:{id:Number.parseInt(req.user.id)}}),
    newAxios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
      },
    }).then(response => response.data).catch(() => "Error fetching user data")
  ])
  
  if(user === "Error fetching user data"){
    res.status(401).json("Error fetching user data")
    return
  }
  
  if(userDB.name !== user.display_name){
    await prisma.user.update({
      where : {id:Number.parseInt(req.user.id)},
      data: {name:user.display_name}
    })
  }

  const [playlist, items] = await Promise.all([
    getCustomPlaylist(req.user.spotify_id, spotifyToken, req.user.playlist_id),
    fetchAllTracksInPlaylist(req.user.playlist_id, spotifyToken)
  ])
  if(playlist.id !== req.user.playlist_id){
    await prisma.user.update({
      where:{id:Number.parseInt(req.user.id)},
      data:{playlistId:playlist.id}
    })
    const token = jwt.sign(
      { id: userDB.id,refresh_token:req.user.refresh_token,playlist_id:playlist.id,genres:userDB.genres, spotify_id: userDB.spotify_id },
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
  }
  const Newitems = items.map(item=>({
    name:item.track.name,
    id:item.track.id,
    uri:item.track.uri,
    artists:[
      {
        name:item.track.artists[0].name,
        id:item.track.artists[0].id,
      }
    ]
  }))
  const bannedArtists = await prisma.artist.findMany({
    where:{
      ignoredBy:{
        some:{userId:Number.parseInt(req.user.id)}
      }
    },
    select:{spotifyId:true, name:true}
  }).then(artists => artists.map(a => ({id:a.spotifyId, name:a.name})))
  /*const usedTracks = await Promise.all((await prisma.UsedTracksByUser.findMany({
    where:{userId:Number.parseInt(req.user.id)}
  })).map(async(many)=>{
    const track = await prisma.track.findFirst({where:{id:many.trackId}})
    const artist = await prisma.artist.findFirst({where:{id:track.artistId}})
    return {id:track.spotifyId,name:track.name, artists:[{id:artist.spotifyId,name:artist.name}]}
  }))*/
  
  const requestedUser = {name:user.display_name, ignoredArtists:bannedArtists,/*usedTracks,*/ playlist:{id:playlist.id,name:playlist.name,items:Newitems}, id:req.user.spotify_id,genres:userDB.genres}
  myCache.set("user_"+req.user.id,requestedUser,5)
  res.json(requestedUser)
})

userRouter.use("/token",getToken);
module.exports = {userRouter}