import HttpErrors from 'http-errors'
import { query as Q, errors as FaunaErrors } from 'faunadb'
import * as Db from '../../db'
import { mergeWithRef } from '../../common'
import {
  UserType,
  RegistrationPayload,
  LoginPayload,
  LoginOutput,
} from './user.type'

const resolveCollectionByType = (type: UserType) => {
  const collectionName = {
    [UserType.CUSTOMER]: Db.CUSTOMERS,
    [UserType.MANAGER]: Db.MANAGERS,
  }[type]

  return Q.Collection(collectionName)
}

const resolveIndexByType = (type: UserType) => {
  const indexName = {
    [UserType.CUSTOMER]: Db.CUSTOMERS_SEARCH_BY_PHONE,
    [UserType.MANAGER]: Db.MANAGERS_SEARCH_BY_PHONE,
  }[type]

  return Q.Index(indexName)
}

const LoginQuery = ({ phone, password, type }: LoginPayload) =>
  Q.Let(
    {
      matched: Q.Match(resolveIndexByType(type), phone),
      loggedIn: Q.Login(Q.Var('matched'), {
        password,
      }),
      user: Q.Get(Q.Var('matched')),
    },
    {
      user: Q.Var('user'),
      authorization: Q.Select('secret', Q.Var('loggedIn')),
    },
  )

const mapLoginOutput = ({ authorization, user }: LoginOutput) => ({
  authorization,
  user: mergeWithRef()(user),
})

export const registerUser = ({
  password,
  type,
  ...payload
}: RegistrationPayload) => {
  const registerQuery = Q.Do(
    Q.Create(resolveCollectionByType(type), {
      data: {
        ...payload,
        registeredAt: Q.Now(),
      },
      credentials: { password },
    }),
    LoginQuery({
      phone: payload.phone,
      password,
      type,
    }),
  )

  return Db.client
    .query<LoginOutput>(registerQuery)
    .then(mapLoginOutput)
}

export const loginUser = (payload: LoginPayload) =>
  Db.client
    .query<LoginOutput>(LoginQuery(payload))
    .then(mapLoginOutput)
    .catch(err =>
      Promise.reject(
        err instanceof FaunaErrors.BadRequest
          ? new HttpErrors.Unauthorized()
          : err,
      ),
    )
