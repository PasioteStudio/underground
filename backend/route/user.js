const { myCache, newAxios } = require("../config")
const express = require("express");
const { getToken } = require("../util/token");
const { authenticate } = require("../middleware/auth");
const { prisma } = require("../util/prisma");
const { getCustomPlaylist } = require("../spotify/playlist");
const userRouter = express()

userRouter.use("/",authenticate)

userRouter.get("/ban/:artist",async(req,res)=>{
    if(!req.params.artist){
        res.status(400).json("Wrong artist!")
        return
    }
    const artist = await prisma.artist.findFirst({
        where:{spotifyId:req.params.artist}
    })
    if(!artist){
        const artistData = await newAxios.get(`https://api.spotify.com/v1/artists/${req.params.artist}`,{
            headers: {
                Authorization: `Bearer ${myCache.get("spotify_access"+req.user.id)}`,
            },
        }).then(response=>{
            return {id:response.data.id,name:response.data.name}
        })
        await prisma.user.update({
            where:{id:Number.parseInt(req.user.id)},
            data:{
                bannedArtists: {
                    create:[{
                        artist:{
                            create:{
                                spotifyId:artistData.id,
                                name:artistData.name
                            }
                        }
                    }]
                }
            }
        })
    }else{
        const isAlreadyConnected = (await prisma.IgnoredArtistsByUser.findMany({
            where:{userId:Number.parseInt(req.user.id)}
        })).map(many=>many.artistId).includes(artist.id)
        if(!isAlreadyConnected){
            await prisma.user.update({
                where:{id:Number.parseInt(req.user.id)},
                data:{
                    bannedArtists: {
                        create:[{
                            artist:{
                                connect:{
                                    id:artist.id
                                }
                            }
                        }]
                    }
                }
            })
        }
    }
    myCache.del("user_"+req.user.id)
    res.json("Artist banned!")
    
})

userRouter.get("/unban/:artist",async(req,res)=>{
    if(!req.params.artist){
        res.status(400).json("Wrong artist!")
        return
    }
    const artist = await prisma.artist.findFirst({
        where:{spotifyId:req.params.artist}
    })
    if(!artist){
      res.status(400).json("Wrong artist!")
      return
    }
    const isAlreadyConnected = (await prisma.IgnoredArtistsByUser.findMany({
        where:{userId:Number.parseInt(req.user.id)}
    })).map(many=>many.artistId).includes(artist.id)
    if(isAlreadyConnected){
      await prisma.IgnoredArtistsByUser.delete({
        where: { userId_artistId: { artistId: artist.id, userId: Number.parseInt(req.user.id) }},
      });
    }
    myCache.del("user_"+req.user.id)
    res.json("Artist unbanned!")
    
})

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
  myCache.del("user_"+req.user.id)
  res.json("Genres updated!")
})

userRouter.get("/",async(req,res)=>{
  if(myCache.has("user_"+req.user.id)){
      return res.json(myCache.get("user_"+req.user.id))
  }
  const userDB = await prisma.user.findFirst({where:{id:Number.parseInt(req.user.id)}})
  const user = await newAxios.get("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${myCache.get("spotify_access"+req.user.id)}`,
    },
  }).then(response=>{
    return response.data
  });
  if(userDB.name != user.display_name){
    await prisma.user.update({
      where : {id:Number.parseInt(req.user.id)},
      data: {
        name:user.display_name
      }
    })
  }

  const playlist = await getCustomPlaylist(req.user.spotify_id,myCache.get("spotify_access"+req.user.id),req.user.playlist_id)
  const items = await newAxios.get(`https://api.spotify.com/v1/playlists/${req.user.playlist_id}/tracks?fields=next%2Citems%28track%28name%2Curi%2Cid%2Cartists%28name%2Cid%29%29%29&limit=50&offset=0`,{
    headers: {
      Authorization: `Bearer ${myCache.get("spotify_access"+req.user.id)}`,
    },
  }).then(async(response)=>{
    let allItems = [...response.data.items]
    let counter = 50
    while(response.data.next){
      response = await newAxios.get(`https://api.spotify.com/v1/playlists/${req.user.playlist_id}/tracks?fields=next%2Citems%28track%28name%2Curi%2Cid%2Cartists%28name%2Cid%29%29%29&limit=50&offset=${counter}`,{
        
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
      uri:item.track.uri,
      artists:[
        {
          name:item.track.artists[0].name,
          id:item.track.artists[0].id,
        }
      ]
    }
  })
  const bannedArtists = await Promise.all((await prisma.IgnoredArtistsByUser.findMany({
    where:{userId:Number.parseInt(req.user.id)}
  })).map(async(many)=>{
    const artist = await prisma.artist.findFirst({where:{id:many.artistId}})
    return {id:artist.spotifyId,name:artist.name}
  }))
  
  const requestedUser = {name:user.display_name, ignoredArtists:bannedArtists, playlist:{id:playlist.id,name:playlist.name,items:Newitems}, id:req.user.spotify_id,genres:userDB.genres}
  myCache.set("user_"+req.user.id,requestedUser,5)
  res.json(requestedUser)
})
userRouter.use("/token",getToken);
module.exports = {userRouter}