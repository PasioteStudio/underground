import axios from "axios"

async function randomWord():Promise<{code:number,message:string}> {
    const word = await axios.get("https://random-word-api.herokuapp.com/word?number=1",{timeout:5000}).then(response=>response.data[0]).catch(async (err)=>{
        const word2 = await axios.get("https://random-words-api.kushcreates.com/api?language=en&words=1",{timeout:5000}).then(response=>{
            console.log(response.data)
            return response.data[0].word
        }).catch(err=>{
            return {code:401,message:"Error fetching random word"}
        })
        if(typeof word2 == "object") return word2
    })
    if(typeof word == "object") return word
    
    return {code:200, message:word}
}

export {randomWord}