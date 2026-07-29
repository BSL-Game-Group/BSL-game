import axios from 'axios'
const rootURL = '/api/bsl-material'

const getMaterial = async (language) => {
    const response = await axios.get(rootURL, { params: { lang: language } })
    return response.data
}

export default { getMaterial }
