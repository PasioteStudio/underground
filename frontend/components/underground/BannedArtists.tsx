"use client"
import { Artist, useProfileContext } from '@/context/Profile';
import { newAxios } from '@/util/axios';
import React, { useEffect, useState } from 'react';

const BannedArtists: React.FC = () => {
    const {profile,update} = useProfileContext()
    const [openedArtists,setOpenedArtists] = useState<boolean>(false)
    const [titlesUnBanArtist,setTitlesUnBanArtist] = useState<string[]>([])

    useEffect(()=>{
        if(!profile) return
        const unban = profile.ignoredArtists.map(artist=>{
          return "UNBAN ARTIST"
        })
        setTitlesUnBanArtist((prev:string[])=>{
            let isWaiting = false;
            for(let i =0;i<prev.length;i++){
                if(prev[i] == "WAIT...") isWaiting = true
            }
            if(isWaiting){
                return prev
            }else{
                return unban
            }
        })
      },[profile])

    const handleUnBan = async(artist:Artist) => {
        if(!profile) return
        const id = profile.ignoredArtists.findIndex((item)=>{
            return item.id == artist.id
        })
        if(titlesUnBanArtist[id] == "WAIT..."){
            return
        }
        titlesUnBanArtist[id] = "WAIT..."
        setTitlesUnBanArtist(JSON.parse(JSON.stringify(titlesUnBanArtist)))
        await newAxios.get(process.env.NEXT_PUBLIC_API_URL + "/user/unban/"+artist.id).then(res=>{
            const id = profile.ignoredArtists.findIndex((item)=>{
                return item.id == artist.id
            })
            if(titlesUnBanArtist[id] == "WAIT..."){
                titlesUnBanArtist[id] = "UNBAN ARTIST" 
            }
        })
        update()
    }

    return profile ? (
    <div className="border rounded-3xl w-full px-5 py-2">
        <div onClick={()=>setOpenedArtists(!openedArtists)} className="bg-gray-800 rounded-2xl px-3 py-1 cursor-pointer items-center flex justify-between">
            <h2 className="select-none text-4xl"><strong>BANNED ARTISTS</strong></h2>
            <h2 className="select-none text-4xl">{openedArtists ? "🔺" : "🔻"}</h2>
        </div>
        <div>
            {openedArtists ? profile.ignoredArtists.map((artist,id)=>{
            return <div key={id} className="flex justify-between py-1 my-1 items-center">
            <p>{artist.name}</p>
            <button onClick={()=>handleUnBan(artist)} className="px-2 py-1 cursor-pointer bg-blue-700 rounded-3xl">{titlesUnBanArtist[id]}</button>
            </div>
        }) : null}
        </div>
    </div>
    ) : null;
};
export default BannedArtists;