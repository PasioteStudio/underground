"use client"

import React from 'react';
import { useProfileContext } from '@/context/Profile';

const Header: React.FC = ({}) => {
    const {profile} = useProfileContext()
    return profile ? <header className='fixed w-full bg-black flex px-4 gap-4 md:px-10 py-3 md:py-5 justify-between items-center'>
        <div>
            <h2 className="text-base md:text-2xl"><strong>{profile.name}</strong></h2>
        </div>
        <div className='flex max-md:flex-col gap-2'>
            <h3 className='max-md:text-sm'><strong>CURRENT PLAYLIST:</strong></h3>
            <h3 className='max-md:text-xs'>{profile.playlist.name} ({profile.playlist.items.length}db)</h3>
        </div>
        <div className='max-w-20 md:max-w-80'>
            <h2 className="text-[10px] md:text-xs"><i>{profile.genres.join(", ")}</i></h2>
        </div>
    </header>
    :
    null
};
export default Header;