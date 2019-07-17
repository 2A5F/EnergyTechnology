const { dirname } = require('path')

const path = process.argv[2]
process.chdir(dirname(path))

const data = require(path)

process.send(data)