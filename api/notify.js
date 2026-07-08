import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { handler } = require('../server/yandex-notify')

export default async function notify(request, response) {
  const body =
    typeof request.body === 'string'
      ? request.body
      : request.body
        ? JSON.stringify(request.body)
        : ''

  const result = await handler({
    httpMethod: request.method,
    headers: request.headers,
    body,
  })

  for (const [key, value] of Object.entries(result.headers || {})) {
    response.setHeader(key, value)
  }

  response.status(result.statusCode).send(result.body)
}
