#!/usr/bin/env node
import { buildPages } from './core.js'
import fs from 'node:fs'
import path from 'node:path'

const configPath = path.join(process.cwd(), "config.json")

function main() {
    let config = {}

    if ( fs.existsSync(configPath) )  {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    }

    buildPages()
}

main()