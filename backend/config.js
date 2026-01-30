const NodeCache = require( "node-cache" ); 
const axios = require('axios');

const myCache = new NodeCache();
const newAxios = axios.create();
newAxios.interceptors.response.use(null, async (error) => {
    if(error.response && error.response.status === 429){
        //rate limit
        setTimeout(()=>{
            return axios.request(error.config);
        },10000)
    }
    return Promise.reject(error);
});

module.exports = { myCache, newAxios };