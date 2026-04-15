import { apiConfig } from './api-config'
import endpoints from './endpoints.json'

export interface UserProfile {
    name: string
    email: string
    currency: string
    syncCode: string | null
}

export interface UpdateProfilePayload {
    name: string
    currency: string
}

export const profileService = {
    async getMe(): Promise<UserProfile> {
        return await apiConfig.get(endpoints.auth.me) as unknown as UserProfile
    },
    async updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
        return await apiConfig.put(endpoints.auth.me, payload) as unknown as UserProfile
    }
}
