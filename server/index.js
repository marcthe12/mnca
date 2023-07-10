import express from 'express';
import morgan from 'morgan';
import http from 'http';
import path from 'path';

export default async function (base_dir) {
  const app = express();

  app.use(morgan(':remote-addr :method :url :http-version :status :response-time ms'));

  app.use(express.static(path.join(base_dir, 'dist')));
  app.get('/favicon.ico', (_req, res) => {
    res.status(204).send();
  });

  const server = http.createServer(app);
  server.on("listening",function(){
    console.log("http:://localhost:3000")
  })

  server.listen({
    port: 3000,
  });

  process.on('exit', () => server.close());
}
