import axios from 'axios'
const rootURL = '/api/microbes'

const getRandom = async () => {
    try {
        const response = await axios.get(`${rootURL}/random`)
        return response.data
    } catch (error) {
        return null
    }
}

export default { getRandom }