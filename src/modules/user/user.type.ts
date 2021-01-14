import { values as V } from 'faunadb'

export enum UserType {
  MANAGER = 'MANAGER',
  CUSTOMER = 'CUSTOMER',
}

export interface User {
  phone: string
  firstName: string
  lastName: string
  registeredAt: Date
}

export interface WithUserType {
  type: UserType
}

export interface UserCredentials {
  phone: string
  password: string
}

export interface LoginPayload extends UserCredentials, WithUserType {}

export interface RegistrationPayload
  extends UserCredentials,
    Omit<User, 'registeredAt'>,
    WithUserType {}

export interface LoginOutput {
  authorization: string
  user: V.Document<User>
}
