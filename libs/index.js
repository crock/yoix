#!/usr/bin/env node
var { buildPages } = require('./core')
var fs = require('fs')
var path = require('path')

var configPath = path.join(process.cwd(), "config.json")

function main() {
    let config = {}

    if ( fs.existsSync(configPath) )  {
        config = require(configPath)
    }

    buildPages()
}

main()