export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: LoginUserProps
}

export interface LoginUserProps {
  email: string
  id: string
  name: string
  roles: Role[]
}

export interface Role {
  roleId: number
  roleName: string
}

export interface LoginProps {
  email: string
  password: string
}

export interface RegisterProps {
  name: string
  email: string
  password: string
  roleId?: number
}

export interface RefreshProps {
  token: string
}

export interface RevokeProps {
  token: string
}
