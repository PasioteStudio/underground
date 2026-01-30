import {newAxios} from "@/util/axios"
import { useEffect, useState } from "react"

interface Artist{
    id:string,
    name:string
}

export interface Track {
    id:string,
    name:string,
    popularity?:number,
    artists:Artist[]
}

interface Playlist{
    id:string,
    name:string,
    items:Track[]
}

interface Profile{
    id:string,
    name:string,
    genres:string[],
    playlist:Playlist
}

function useProfile(){
    const [profile,setProfile] = useState<Profile>()

    useEffect(()=>{
        newAxios.get(process.env.NEXT_PUBLIC_API_URL + "/user").then(response=>{
            response.data.genres = response.data.genres.split(",")
            setProfile(response.data)
        })
    },[])
    const update = () => {
        newAxios.get(process.env.NEXT_PUBLIC_API_URL + "/user").then(response=>{
            response.data.genres = response.data.genres.split(",")
            setProfile(response.data)
        })
    }
    return {profile,setProfile,update}
}

export default useProfile