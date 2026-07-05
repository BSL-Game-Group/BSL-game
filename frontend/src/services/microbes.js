import axios from 'axios'
const rootURL = '/api/microbes'

const getRandom = async () => {
    const response = await axios.get(`${rootURL}/random`)
    return response.data
}

export default { getRandom }