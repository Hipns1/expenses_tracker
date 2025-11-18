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

export interface RefreshProps {
  refreshToken: string
  accessToken: string
}
