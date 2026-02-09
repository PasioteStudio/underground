"use client"

import {newAxios} from "@/util/axios"
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react"

export interface Artist{
    id:string,
    name:string
}

export interface Track {
    id:string,
    uri:string,
    name:string,
    popularity?:number,
    artists:Artist[]
}

export interface Playlist{
    id:string,
    name:string,
    items:Track[]
}

interface Profile{
    id:string,
    name:string,
    ignoredArtists:Artist[],
    genres:string[],
    playlist:Playlist
}

type ProfileContextType = {
    profile: Profile | undefined,
    setProfile: Dispatch<SetStateAction<Profile | undefined>>,
    update: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function useProfile(){
    const [profile,setProfile] = useState<Profile | null>()

    useEffect(()=>{
        newAxios.get(process.env.NEXT_PUBLIC_API_URL + "/user").then(response=>{
            response.data.genres = response.data.genres.split(",")
            setProfile(response.data)
        }).catch(err=>{
            setProfile(null)
        })
    },[])
    const update = () => {
        newAxios.get(process.env.NEXT_PUBLIC_API_URL + "/user").then(response=>{
            response.data.genres = response.data.genres.split(",")
            setProfile(response.data)
        }).catch(err=>{
            setProfile(null)
        })
    }
    return {profile,setProfile,update}
}

export function ProfileProvider({children}:{children:React.ReactNode}){
    const value = useProfile()
    return <ProfileContext.Provider value={value as ProfileContextType}>{children}</ProfileContext.Provider>
}

export function useProfileContext(){
    const ctx = useContext(ProfileContext)
    if(!ctx) throw new Error("useProfileContext must be used within a ProfileProvider")
    return ctx
}

export default ProfileContext