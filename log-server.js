import http from 'http'

const PORT = 3999
const logs = []

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'POST' && req.url === '/log') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        const timestamp = new Date().toISOString().slice(11, 23)
        console.log(`[${timestamp}] [${data.source}] ${data.message}`)
        if (data.data) {
          console.log('  Data:', JSON.stringify(data.data, null, 2).split('\n').join('\n  '))
        }
        logs.push({ timestamp, ...data })
      } catch (e) {
        console.log('Raw:', body)
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"ok":true}')
    })
    return
  }

  if (req.method === 'GET' && req.url === '/logs') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(logs, null, 2))
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`Log server listening on http://localhost:${PORT}`)
  console.log('POST /log - send logs')
  console.log('GET /logs - view all logs')
  console.log('\nWaiting for logs from extension...\n')
})
