import axios from "axios"
import {spotifyAxios} from "./axios"
import { Track } from "@/hooks/useProfile"

function doesTheTrackWorthIt(track:Track,items:Track[],to_be_added:Track[]){
    let theTrackAlreadyIncluded = false
    for(let i =0;i<items.length;i++){
        if((items[i].artists[0].name == track.artists[0].name &&
            items[i].name == track.name) ||
            (items[i].artists[0].name == track.artists[0].name &&
            items[i].name.includes(track.name)) ||
            (items[i].artists[0].name == track.artists[0].name &&
            track.name.includes(items[i].name))
        ) {
            theTrackAlreadyIncluded = true
            break;
        }
    }
    let theTrackWannaBeIncluded = false
    for(let i =0;i<to_be_added.length;i++){
        if((to_be_added[i].artists[0].name == track.artists[0].name &&
            to_be_added[i].name == track.name) ||
            (to_be_added[i].artists[0].name == track.artists[0].name &&
            to_be_added[i].name.includes(track.name)) ||
            (to_be_added[i].artists[0].name == track.artists[0].name &&
            track.name.includes(to_be_added[i].name))
        ) {
            theTrackAlreadyIncluded = true
            break;
        }
    }

    return track.popularity == 0 && !theTrackAlreadyIncluded && !theTrackWannaBeIncluded
}

async function addUnderground(genres:string[],playlist_id:string){
    const word = await axios.get("https://random-word-api.herokuapp.com/word?number=1").then(response=>response.data[0])
    const items = await spotifyAxios.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?fields=items%28track%28id%2Cname%2Cartists%28name%29%29%29&limit=50&offset=0`).then(response=>{
        return response.data.items.map((item:{track:Track})=>{
            return item.track
        })
    })
    const to_be_added:Track[] = []
    for(let i =0;i<genres.length;i++){
        await spotifyAxios.get(`https://api.spotify.com/v1/search?q=${word}%20genre%3A${genres[i]}%20tag%3Ahipster&type=track&limit=10&offset=0`).then(async (response) => {
            for(let x = 0;x<response.data.tracks.items.length;x++){
                const item = response.data.tracks.items[x];
                await spotifyAxios.get(`https://api.spotify.com/v1/tracks/${item.id}`).then(async (res)=>{
                    if(doesTheTrackWorthIt(res.data,items,to_be_added)) to_be_added.push({id:res.data.uri,name:res.data.name,artists:[{id:res.data.artists[0].id,name:res.data.artists[0].name}]})
                })
            }
        })
    }
    if(to_be_added.length == 0){
        return "No new tracks to add";
    }else if(to_be_added.length > 100){
        const first_batch = to_be_added.slice(0,100).map(item=>item.id);
        const second_batch = to_be_added.slice(100).map(item=>item.id);
        await spotifyAxios.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,{
            uris: first_batch,
        })
        await spotifyAxios.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,{
            uris: second_batch,
        })
    }else{
        await spotifyAxios.post(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,{
            uris: to_be_added.map(item=>item.id),
        })
    }
    return "Tracks added"
    
}
export {addUnderground}