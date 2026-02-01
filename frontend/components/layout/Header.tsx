"use client"

import React from 'react';
import { useProfileContext } from '@/context/Profile';

const Header: React.FC = ({}) => {
    const {profile} = useProfileContext()
    return profile ? <header className='fixed w-full bg-black flex px-10 py-5 justify-between items-center'>
        <div>
            <h2 className="text-2xl"><strong>{profile.name}</strong></h2>
        </div>
        <div>
            <h3><strong>CURRENT PLAYLIST:</strong> {profile.playlist.name} ({profile.playlist.items.length}db)</h3>
        </div>
        <div className='max-w-80'>
            <h2 className="text-xs"><i>{profile.genres.join(", ")}</i></h2>
        </div>
    </header>
    :
    null
};
export default Header;