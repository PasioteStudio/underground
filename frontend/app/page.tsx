"use client"
import useProfile from "@/hooks/useProfile";
import { addUnderground } from "@/util/spotify";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const {profile,update} = useProfile()
  const [title,setTitle] = useState<string>("ADD UNDERGROUND TRACKS")

  useEffect(()=>{

  },[profile])
  const handleUnderground = async() => {
    if(!profile || title == "WAIT...") return;
    setTitle("WAIT...")
    await addUnderground(profile.genres,profile.playlist.id)
    update()
    setTitle("DONE!")
    setTimeout(()=>{
      setTitle("ADD UNDERGROUND TRACKS")
    },5000)
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {profile ? 
        <div>
          <div>
            <h1 className="text-2xl"><strong>{profile.name}</strong></h1>
            <h2 className="text-xl"><i>{profile.genres.join(",")}</i></h2>
          </div>
          <div>
            <h3><strong>CURRENT PLAYLIST:</strong> {profile.playlist.name} {profile.playlist.items.length}db</h3>
            <button onClick={handleUnderground} className="cursor-pointer rounded bg-red-700 text-3xl px-2 py-1" >{title}</button>
          </div>
          <div>
            {profile.playlist.items.map(item=>{
              return <div className="flex gap-4">
                <h2>{item.name}</h2><p>--</p><p>{item.artists[0].name}</p>
              </div>
            })}
          </div>
        </div> 
        : 
        <div>
          <Link className="rounded bg-red-700 text-3xl px-2 py-1" href={process.env.NEXT_PUBLIC_API_URL + "/login"}>Login</Link>
        </div>
        }
      </main>
    </div>
  );
}
