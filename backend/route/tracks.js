const { myCache, newAxios } = require("../config")
const express = require("express");
const { authenticate } = require("../middleware/auth");
const { prisma } = require("../util/prisma");
const tracksRouter = express()

tracksRouter.use("/",authenticate)

tracksRouter.post("/worth",async(req,res)=>{
    if(!req.body.tracks || !req.body.tracks.length || req.body.tracks.length < 1 || !req.body.tracks.every(track=>typeof track == "string") || !Array.isArray(req.body.tracks)){
        res.status(400).json("Wrong tracks!")
        return
    }
    const not_to_be_added = []
    //alread used?
    await prisma.track.findMany({
        where:{spotifyId:{in:req.body.tracks}}
    }).then(async(tracks)=>{
        for(const track of tracks){
            const alreadyUsed = await prisma.UsedTracksByUser.findUnique({
                where:{trackId:track.id,userId:Number.parseInt(req.user.id)}
            })
            if(alreadyUsed){
                not_to_be_added.push(track.spotifyId)
            }
        }
    })
    //
    const to_be_added = req.body.tracks.filter(track=>!not_to_be_added.includes(track))
    res.json(to_be_added)
})

tracksRouter.get("/ban/:artist",async(req,res)=>{
    if(!req.params.artist){
        res.status(400).json("Wrong artist!")
        return
    }
    const artist = await prisma.artist.findUnique({
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

tracksRouter.post("/usedtracks",async(req,res)=>{
    if(!req.body.tracks 
      || !req.body.tracks.length 
      || req.body.tracks.length < 1 
      || !req.body.tracks.every(track=>typeof track == "string")
      || !Array.isArray(req.body.tracks)){
        res.status(400).json("Wrong tracks!")
        return
    }
    for(const track of req.body.tracks){
      const alreadytrack = await prisma.track.findUnique({
        where:{spotifyId:track}
      })
      if(!alreadytrack){
          const trackData = await newAxios.get(`https://api.spotify.com/v1/tracks/${track}`,{
              headers: {
                  Authorization: `Bearer ${myCache.get("spotify_access"+req.user.id)}`,
              },
          }).then(response=>{
              return {id:response.data.id,name:response.data.name,artists:[{id:response.data.artists[0].id,name:response.data.artists[0].name}]}
          })
          let alreadyArtist = await prisma.artist.findUnique({
              where:{spotifyId:trackData.artists[0].id}
          })
          if(!alreadyArtist){
            alreadyArtist = await prisma.artist.create({
                data:{
                    spotifyId:trackData.artists[0].id,
                    name:trackData.artists[0].name
                }
            })
          }
          await prisma.user.update({
              where:{id:Number.parseInt(req.user.id)},
              data:{
                  usedTracks: {
                      create:[{
                          track:{
                              create:{
                                  spotifyId:trackData.id,
                                  name:trackData.name,
                                  artistId:alreadyArtist.id
                              }
                          }
                      }]
                  }
              }
          })
      }else{
          const isAlreadyConnected = (await prisma.UsedTracksByUser.findMany({
              where:{userId:Number.parseInt(req.user.id)}
          })).map(many=>many.trackId).includes(alreadytrack.id)
          if(!isAlreadyConnected){
              await prisma.user.update({
                  where:{id:Number.parseInt(req.user.id)},
                  data:{
                      usedTracks: {
                          create:[{
                              track:{
                                  connect:{
                                      id:alreadytrack.id
                                  }
                              }
                          }]
                      }
                  }
              })
          }
      }
    }
    myCache.del("user_"+req.user.id)
    res.json("Track used!")
    
})

tracksRouter.get("/unban/:artist",async(req,res)=>{
    if(!req.params.artist){
        res.status(400).json("Wrong artist!")
        return
    }
    const artist = await prisma.artist.findUnique({
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


module.exports = {tracksRouter}