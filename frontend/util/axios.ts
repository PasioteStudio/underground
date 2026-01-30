import axios from "axios";

const newAxios = axios.create()

newAxios.interceptors.request.use(async (config) => {
    config.withCredentials = true
    config.headers.Authorization = `Bearer ${localStorage.getItem("access_token")}`;
    return config;
});

newAxios.interceptors.response.use(null, async (error) => {
    if (error.response && error.response.status === 401) {
        const token = await axios.get(process.env.NEXT_PUBLIC_API_URL+"/token",{withCredentials:true}).then(response=>{
            return response.data.access_token
        })
        localStorage.setItem("access_token",token)
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

const spotifyAxios = axios.create()

spotifyAxios.interceptors.request.use(async (config) => {
    config.headers.Authorization = `Bearer ${localStorage.getItem("access_token")}`;
    return config;
});

spotifyAxios.interceptors.response.use(null, async (error) => {
    if (error.response && error.response.status === 401) {
        const token = await axios.get(process.env.NEXT_PUBLIC_API_URL+"/token",{withCredentials:true}).then(response=>{
            return response.data.access_token
        })
        localStorage.setItem("access_token",token)
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

export {newAxios,spotifyAxios}