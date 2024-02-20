import axios from 'axios'

export const verifyImage =  async (url: string) => {
    try {
        const { data } = await axios.get('https://api.sightengine.com/1.0/check-workflow.json', {
            params: {
              'url': url,
              'workflow': 'wfl_fHwO1XapP8qv7jmyOfYgw',
              'api_user': '176776132',
              'api_secret': import.meta.env.VITE_SIGHTENGINE_SECRET_KEY,
            }
          })          

        return data
    } catch (error) {
        console.error(error)
    }
}