"use client"
import { useProfileContext } from '@/context/Profile';
import { newAxios } from '@/util/axios';
import React from 'react';

const Footer: React.FC = ({}) => {
    const {profile,update} = useProfileContext()
    const handleLogout = async() => {
        await newAxios.delete(process.env.NEXT_PUBLIC_API_URL + "/logout")
        update()
    }
    return profile ? <footer className='fixed bottom-0 w-full bg-black flex px-10 py-5 justify-between items-center'>
        <div></div>
        <div>
            <button onClick={handleLogout} className="px-2 py-1 cursor-pointer bg-red-700 rounded-3xl">LOGOUT</button>
        </div>
    </footer>
    :
    null
};
export default Footer;