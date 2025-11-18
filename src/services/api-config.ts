import axios from 'axios'
import { API_URL } from '@/utils/consts'
import { useBoundStore } from '@/hooks/use-bound-store'

export const apiConfig = axios.create({
  baseURL: API_URL
})

apiConfig.interceptors.response.use(
  (res) => res.data,
  (error) => Promise.reject(error)
)

apiConfig.interceptors.request.use((config) => {
  const { accessToken } = useBoundStore.getState()
  if (!config.headers['Skip-Auth']) {
    if (accessToken !== null) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
  } else {
    delete config.headers['Skip-Auth']
  }

  return config
})
