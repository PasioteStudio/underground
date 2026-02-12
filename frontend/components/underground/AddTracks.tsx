"use client"
import { useProfileContext } from '@/context/Profile';
import { randomWord } from '@/util/randomWord';
import { addUnderground } from '@/util/spotify';
import React, { useRef, useState } from 'react';

const AddTracks: React.FC = () => {
    const {profile,update} = useProfileContext()
    const [title,setTitle] = useState<string>("ADD UNDERGROUND TRACKS")
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [word,setWord] = useState<string>()
    const [timeout,setTimeoutId] = useState<NodeJS.Timeout>()
    const handleUnderground = async() => {
        if(!profile || title == "WAIT...") return;
        if(!word || word == ""){
            setTitle("No word selected!")
        }else{
            setTitle("WAIT...")
            const response = await addUnderground(word,profile.ignoredArtists,profile.genres,profile.playlist.id)
            if(response.code == 200){
                update()
            }
            setTitle(response.message)
        }
        if(timeout != undefined){
            clearTimeout(timeout)
        }
        const timeoutId = setTimeout(()=>{
            setTitle("ADD UNDERGROUND TRACKS")
        },5000)
        setTimeoutId(timeoutId) 
    }
    const handleRandomWord = async() => {
        const word = await randomWord()
        if(word.code == 200){
            setWord(word.message)
            inputRef.current!.value = word.message
        }else{
            setTitle("Couldn't generate random word!")
            const timeoutId = setTimeout(()=>{
                setTitle("ADD UNDERGROUND TRACKS")
            },5000)
            setTimeoutId(timeoutId) 
        }
        
    }
    return <div className='flex flex-col items-center gap-2'>
        <button onClick={handleRandomWord} className='px-1 py-1 text-4xl cursor-progress rounded-lg bg-gray-600'>🔄️</button>
        <input ref={inputRef} onInput={(value)=>setWord(value.currentTarget.value)} placeholder='random word' className='px-2 py-1 bg-gray-600 rounded-lg' type="text" name="word" id="wprd" />
        <button onClick={handleUnderground} className="mx-auto cursor-cell rounded-4xl bg-green-700 text-3xl px-5 py-2" >{title}</button>
    </div>
};
export default AddTracks;