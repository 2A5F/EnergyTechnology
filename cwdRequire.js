const { fork } = require('child_process')

/** @param {string} path */
async function cwdRequire(path) {
    const child = fork('./toReq.js', [path], {
        stdio: 'inherit'
    })
    const data = await new Promise(res => { child.on('message', res) })
    return data
}

module.exports = {
    cwdRequire
}