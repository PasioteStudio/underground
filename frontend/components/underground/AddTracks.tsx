"use client"
import { useProfileContext } from '@/context/Profile';
import { addUnderground } from '@/util/spotify';
import React, { useState } from 'react';

const AddTracks: React.FC = () => {
    const {profile,update} = useProfileContext()
    const [title,setTitle] = useState<string>("ADD UNDERGROUND TRACKS")
    const handleUnderground = async() => {
        if(!profile || title == "WAIT...") return;
        setTitle("WAIT...")
        const response = await addUnderground(profile.ignoredArtists,profile.genres,profile.playlist.id)
        if(response.code == 200){
            update()
        }
        setTitle("DONE!")
        setTimeout(()=>{
            if(title != "WAIT...")setTitle("ADD UNDERGROUND TRACKS")
        },5000)
    }
    return <button onClick={handleUnderground} className="mx-auto cursor-cell rounded-4xl bg-green-700 text-3xl px-5 py-2" >{title}</button>
};
export default AddTracks;