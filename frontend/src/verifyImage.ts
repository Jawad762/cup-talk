import axios from 'axios'

export const verifyImage =  async (url: string) => {
    try {
        const { data } = await axios.get('https://api.sightengine.com/1.0/check-workflow.json', {
            params: {
              'url': url,
              'workflow': 'wfl_fHwO1XapP8qv7jmyOfYgw',
              'api_user': '176776132',
              'api_secret': '4TnKYo4KyMXXc7VVyin5NzAej6MzcDnc',
            }
          })          

        return data
    } catch (error) {
        console.error(error)
    }
}