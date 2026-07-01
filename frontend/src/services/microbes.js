import axios from 'axios'
const rootURL = '/api/microbes'

const getRandom = () => axios.get(`${rootURL}/random`).then(res => res.data)

export default { getRandom }