"use client"

import React, { useEffect } from 'react';

const Redirect: React.FC = () => {
    useEffect(()=>{
        const URL_Patterns = new URL(window.location.href);
        const redirectUrl = URL_Patterns.searchParams.get('URL');
        const response_type = URL_Patterns.searchParams.get('response_type');
        const client_id = URL_Patterns.searchParams.get('client_id');
        const scope = URL_Patterns.searchParams.get('scope');
        const redirect_uri = URL_Patterns.searchParams.get('redirect_uri');
        const code_challenge = URL_Patterns.searchParams.get('code_challenge');
        const code_challenge_method = URL_Patterns.searchParams.get('code_challenge_method');
        if (redirectUrl && response_type && client_id && scope && redirect_uri
        && code_challenge && code_challenge_method) {
            window.location.href = redirectUrl + new URLSearchParams({
                response_type: response_type,
                client_id: client_id,
                scope: scope,
                redirect_uri: redirect_uri,
                code_challenge_method: code_challenge_method,
                code_challenge: code_challenge,
            });
            return
        }
        const code = URL_Patterns.searchParams.get('code');
        if(code){
            window.location.href = process.env.NEXT_PUBLIC_API_URL + "/callback?" + new URLSearchParams({
                code: code,
            });
            return
        }
    },[])
    
    return (
    <div>
    
    </div>
    );
};
export default Redirect;