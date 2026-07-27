import axios from 'axios'
const rootURL = '/api/microbes'

const getLanguage = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('selectedLanguage') || 'en'
    }
    return 'en'
}

const getRandom = async () => {
    try {
        const language = getLanguage()
        const response = await axios.get(`${rootURL}/random`, {
            params: { lang: language }
        })
        return response.data
    } catch {
        return null
    }
}

export default { getRandom }