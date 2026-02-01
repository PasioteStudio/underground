"use client"
import { Artist, useProfileContext } from '@/context/Profile';
import { newAxios } from '@/util/axios';
import { removeBANNED } from '@/util/spotify';
import React, { useEffect, useState } from 'react';

const Playlist: React.FC = () => {
    const {profile,update} = useProfileContext()
    const [openedPlaylist,setOpenedPlaylist] = useState<boolean>(false)
    const [titlesBanArtist,setTitlesBanArtist] = useState<string[]>([])

    useEffect(()=>{
        if(!profile) return
        const ban = profile.playlist.items.map(item=>{
        return "BAN ARTIST"
        })
        setTitlesBanArtist(ban)
    },[profile])

    const handleBan = async(artist:Artist) => {
        if(!profile) return
        for(let i =0;i<profile.playlist.items.length;i++){
        if(profile.playlist.items[i].artists[0].id == artist.id){
            if(titlesBanArtist[i] == "WAIT..."){
            return
            }
            titlesBanArtist[i] = "WAIT..."
        }
            
        }
        setTitlesBanArtist(JSON.parse(JSON.stringify(titlesBanArtist)))
        await newAxios.get(process.env.NEXT_PUBLIC_API_URL + "/user/ban/"+artist.id)
        await removeBANNED(profile.playlist,[...profile.ignoredArtists,artist])
        update()
    }

    return profile ? (
    <div className="border rounded-3xl w-full px-5 py-2">
        <div onClick={()=>setOpenedPlaylist(!openedPlaylist)} className="bg-gray-800 rounded-2xl px-3 py-1 cursor-pointer items-center flex justify-between">
            <h2 className="select-none text-4xl"><strong>TRACKS</strong></h2>
            <h2 className="select-none text-4xl">{openedPlaylist ? "🔺" : "🔻"}</h2>
        </div>
        <div>
            {openedPlaylist ? profile.playlist.items.map((item,id)=>{
            return <div key={id} className="flex gap-4 py-1 my-1 items-center justify-between">
            <p>{item.name}</p>
            <div className="flex gap-2 items-center">
                <p>{item.artists[0].name}</p>
                <button onClick={()=>handleBan(item.artists[0])} className="px-2 py-1 cursor-not-allowed bg-red-700 rounded-3xl">{ titlesBanArtist[id]}</button>
            </div>
            </div>
        }) : null}
        </div>
    </div>
    ) : null;
};
export default Playlist;