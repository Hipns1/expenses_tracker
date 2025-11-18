import { ReactNode } from 'react'
import { RouteObject } from 'react-router-dom'

export type RouteProps = {
  titleMenu?: string
  isExcludeNav?: boolean
  icon?: string | ReactNode
  isAuthRestricted?: boolean
  name?: string
  urlImg?: string
  component?: string
  id?: number
  path?: string
  isActive?: boolean
} & Omit<RouteObject, 'children'>
