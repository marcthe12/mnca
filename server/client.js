import express from 'express'
import path from 'node:path'

export default function (base_dir) {
  const router = express.Router()
  router.use(express.static(path.join(base_dir, 'dist')));
  router.use(async (_req, res) => {
    res.sendFile(path.join(base_dir, 'dist', 'index.html'))
  })
  return router
}
