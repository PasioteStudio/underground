"use client"
import AddTracks from "@/components/underground/AddTracks";
import BannedArtists from "@/components/underground/BannedArtists";
import Genres from "@/components/underground/Genres";
import Playlist from "@/components/underground/Playlist";
import { useProfileContext } from "@/context/Profile";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  const {profile} = useProfileContext()
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-[110vh] w-full max-w-3xl flex-col items-center justify-between py-32 px-4 md:px-16 bg-white dark:bg-black sm:items-start">
        {profile ? 
        <div className="flex flex-col gap-10 w-full justify-center">
          <AddTracks />
          <Playlist />
          <BannedArtists />
          <Genres />
        </div> 
        : 
        profile === null ? 
          <a className="mx-auto rounded bg-red-700 text-3xl px-2 py-1" href={process.env.NEXT_PUBLIC_API_URL + "/login"}>Login</a>
         : null
        }
      </main>
    </div>
  );
}
