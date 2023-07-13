import express from 'express'
import morgan from 'morgan'
import http from 'http'
import client from './client.js'
import api from './api.js'

export default async function(base_dir, config) {
  const app = express()

  app.use(morgan(':remote-addr :method :url :http-version :status :response-time ms'))

  app.get('/', async (_req, res) => {
    res.redirect('/ui')
  })

  app.use('/ui', client(base_dir))

  app.use('/', api())

  app.get('/favicon.ico', async (_req, res) => {
    res.status(204).send();
  })

  const server = http.createServer(app);

  server.listen({
    port: config.port,
    host: config.host,
  }, async function() {
    const addr = this.address()
    console.log(`Listening on ${addr ? typeof addr === "string" ? addr : `${addr.port} on ${addr.address}` : "Unknown Socket"}`)
  })

  process.on('exit', () => server.close());
}
