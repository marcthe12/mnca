#!/usr/bin/env node

import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import main from './server/index.js'

const filename = fileURLToPath(import.meta.url)
const base_dir = dirname(filename);

await main(base_dir)

