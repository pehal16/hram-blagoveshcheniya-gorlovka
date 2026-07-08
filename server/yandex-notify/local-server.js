const http = require('node:http')
const { handler } = require('./index')

const port = Number(process.env.PORT || 8787)

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []

    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

const server = http.createServer(async (request, response) => {
  try {
    const body = await readBody(request)
    const result = await handler({
      httpMethod: request.method,
      headers: request.headers,
      body,
    })

    response.writeHead(result.statusCode, result.headers)
    response.end(result.body)
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
    response.end(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown local server error',
      }),
    )
  }
})

server.listen(port, () => {
  console.log(`Notification endpoint is listening on http://127.0.0.1:${port}`)
})
