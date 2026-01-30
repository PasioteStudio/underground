const NodeCache = require( "node-cache" ); 
const axios = require('axios');
const { getToken } = require("./auth/token");

const myCache = new NodeCache();
const newAxios = axios.create();
newAxios.interceptors.request.use(async (config) => {
    config.headers.Authorization = `Bearer ${myCache.get("spotify_token")}`;
    return config;
});
newAxios.interceptors.response.use(null, async (error) => {
    if (error.response && error.response.status === 401) {
        const token = await getToken();
        if (token) {
            error.config.headers.Authorization = `Bearer ${token}`;
            return axios.request(error.config);
        }
    }else if(error.response && error.response.status === 429){
        //rate limit
        setTimeout(()=>{
            return axios.request(error.config);
        },10000)
    }
    return Promise.reject(error);
});

module.exports = { myCache, newAxios };