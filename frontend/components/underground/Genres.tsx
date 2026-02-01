"use client"
import { useProfileContext } from '@/context/Profile';
import { newAxios } from '@/util/axios';
import React, { useState } from 'react';

const Genres: React.FC = () => {
    const {profile,update} = useProfileContext()
    const [titleGenres,setTitleGenres] = useState<string>("SAVE")
    const handleGenres = async (e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if(!profile || titleGenres == "WAIT...")return
        setTitleGenres("WAIT...")
        const formData = new FormData(e.currentTarget)
        const genres = formData.get("genres") as string
        await newAxios.patch(process.env.NEXT_PUBLIC_API_URL + "/user/genres",{
        genres:genres.split(", ")
        })
        update()
        setTitleGenres("SAVE")
    }

    return profile ? (
    <div className="border rounded-3xl w-full px-5 py-2">
        <div className="bg-gray-800 rounded-2xl px-3 py-1 cursor-pointer items-center flex justify-between">
            <h2 className="select-none text-4xl"><strong>GENRES</strong></h2>
        </div>
        <div>
            <form onSubmit={handleGenres} className="flex justify-between gap-4 py-1 my-1 items-center">
            <textarea name="genres" id="genres" className="bg-gray-600 px-2 py-1 rounded-lg w-full" defaultValue={profile.genres.join(", ")}></textarea>
            <button className="px-2 py-1 cursor-pointer bg-blue-700 rounded-3xl">{titleGenres}</button>
            </form>
        </div>
    </div>
    ) : null;
};
export default Genres;