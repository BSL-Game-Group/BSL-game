import axios from 'axios'
const rootURL = '/api/microbes'

const getLanguage = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('selectedLanguage') || 'en'
    }
    return 'en'
}
const getSessionId = () => {
    if (typeof window !== 'undefined' && window.__gameData) {
        return window.__gameData.sessionId
    }
    return null
}

const getRandom = async () => {
    try {
        const language = getLanguage()
        
        const sessionId = getSessionId() 
        
        const response = await axios.get(`${rootURL}/random`, {
            params: { 
                lang: language,
                session_id: sessionId 
            }
        })
        return response.data
    } catch {
        return null
    }
}

const resetSession = async () => {
    try {
        const sessionId = getSessionId()
        if (sessionId) {
            await axios.post(`${rootURL}/reset`, { session_id: sessionId })
        }
    } catch (error) {
        console.error('Failed to reset session microbes', error)
    }
}

export default { getRandom, resetSession }