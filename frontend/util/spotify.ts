import axios from "axios"
import {newAxios, spotifyAxios} from "./axios"
import { Artist, Playlist, Track } from "@/context/Profile"

function doesTheTrackWorthIt(track:Track,items:Track[],to_be_added:Track[],artistsToIgnore:Artist[],usedTracks:Track[]){
    //is the artist banned
    for(let i =0;i<artistsToIgnore.length;i++){
        if(track.artists[0].id == artistsToIgnore[i].id) return false
    }
    //the Track already Included
    for(let i =0;i<items.length;i++){
        if((items[i].artists[0].name == track.artists[0].name &&
            items[i].name == track.name) ||
            (items[i].artists[0].name == track.artists[0].name &&
            items[i].name.includes(track.name)) ||
            (items[i].artists[0].name == track.artists[0].name &&
            track.name.includes(items[i].name))
        ) {
            return false
        }
    }
    //the Track already Wants Be Included
    for(let i =0;i<to_be_added.length;i++){
        if((to_be_added[i].artists[0].name == track.artists[0].name &&
            to_be_added[i].name == track.name) ||
            (to_be_added[i].artists[0].name == track.artists[0].name &&
            to_be_added[i].name.includes(track.name)) ||
            (to_be_added[i].artists[0].name == track.artists[0].name &&
            track.name.includes(to_be_added[i].name))
        ) {
            return false
        }
    }
    //the Track already Used
    for(let i =0;i<usedTracks.length;i++){
        if(usedTracks[i].id == track.id) return false
    }

    return track.popularity == 0
}

async function addUnderground(artistsToIgnore:Artist[],genres:string[],playlist_id:string,usedTracks:Track[]):Promise<{code:number,message:string}> {
    const word = await axios.get("https://random-word-api.herokuapp.com/word?number=1",{timeout:5000}).then(response=>response.data[0]).catch(async (err)=>{
        const word2 = await axios.get("https://random-words-api.kushcreates.com/api?language=en&words=1",{timeout:5000}).then(response=>{
            console.log(response.data)
            return response.data[0].word
        }).catch(err=>{
            return {code:401,message:"Error fetching random word"}
        })
        if(typeof word2 == "object") return word2
    })
    if(typeof word == "object") return word
    const items = await spotifyAxios.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=items%28track%28id%2Cname%2Cartists%28name%29%29%29&limit=50&offset=0`).then(response=>{
        return response.data.items.map((item:{track:Track})=>{
            return item.track
        })
    })
    const to_be_added:Track[] = []
    for(let i =0;i<genres.length;i++){
        await spotifyAxios.get(`https://api.spotify.com/v1/search?q=${word}%20genre%3A${genres[i]}%20tag%3Ahipster&type=track&limit=10&offset=0&market=ES`).then(async (response) => {
            for(let x = 0;x<response.data.tracks.items.length;x++){
                const item = response.data.tracks.items[x];
                await spotifyAxios.get(`https://api.spotify.com/v1/tracks/${item.id}`).then(async (res)=>{
                    if(doesTheTrackWorthIt(res.data,items,to_be_added,artistsToIgnore,usedTracks)) to_be_added.push({id:res.data.id,uri:res.data.uri, name:res.data.name,artists:[{id:res.data.artists[0].id,name:res.data.artists[0].name}]})
                })
            }
        })
    }
    if(to_be_added.length == 0){
        return {code:404,message:"No new tracks to add"};
    }else if(to_be_added.length > 100){
        const first_batch = to_be_added.slice(0,100).map(item=>item.uri);
        const second_batch = to_be_added.slice(100).map(item=>item.uri);
        await spotifyAxios.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,{
            uris: first_batch,
        })
        await spotifyAxios.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,{
            uris: second_batch,
        })
    }else{
        await spotifyAxios.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,{
            uris: to_be_added.map(item=>item.uri),
        })
    }
    await newAxios.post(process.env.NEXT_PUBLIC_API_URL + "/user/usedtracks",{
        tracks: to_be_added.map(item=>item.id)
    })
    return {code:200, message:"Tracks added"}
    
}

async function removeBANNED(playlist:Playlist,artistsToIgnore:Artist[]):Promise<{code:number,message:string}> {
    const tracksToRemove = []
    for(let i =0;i<playlist.items.length;i++){
        if(artistsToIgnore.map(artist=>artist.id).includes(playlist.items[i].artists[0].id))tracksToRemove.push(playlist.items[i].uri)
    }

    await spotifyAxios.delete(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        data: {
            tracks: tracksToRemove.map(uri => ({ uri }))
        }
    })
    return {code:200, message:"Tracks deleted!"}
}
export {addUnderground,removeBANNED}