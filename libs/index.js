#!/usr/bin/env node
const { buildPages } = require('./core')
const fs = require('fs')
const path = require('path')

const configPath = path.join(process.cwd(), "config.json")

function main() {
    let config = {}

    if ( fs.existsSync(configPath) )  {
        config = require(configPath)
    }

    buildPages()
}

main()