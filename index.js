#!/usr/bin/env node

import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import main from './server/index.js'

async function optImport(file) {
  try {
    return (await import(file)).default
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      return async () => {}
    } else {
      throw error
    }
  }
}

const filename = fileURLToPath(import.meta.url)
const base_dir = dirname(filename)

const config = await optImport(process.argv[2] === 'undefined' ? resolve(process.argv[2]) : join(process.cwd(), 'config.js'))

await main(base_dir, await config())

