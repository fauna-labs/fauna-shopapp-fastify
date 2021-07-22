import Fauna from 'faunadb'

const SECRET =
  process.env.FAUNA_SECRET_SERVER_KEY ||
  process.env.FAUNA_SECRET_ADMIN_KEY

if (!SECRET) {
  throw new Error('Missing "FAUNA_SECRET_SERVER_KEY" env variable')
}

const headers = {
  'x-fauna-source': 'shopapp-fastify',
}

export const client = new Fauna.Client({
  secret: SECRET,
  headers,
})

export const clientForSecret = (secret: string) =>
  new Fauna.Client({
    secret,
    headers,
  })
