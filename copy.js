/** @type {{win: `%appdata%/Factorio/mods`,osx: `~/Library/Application Support/factorio/mods`,linux: `~/.factorio/mods`}} */
const FactorioPath = {
    get win() { return `${process.env.APPDATA}/Factorio/mods` },
    osx: `~/Library/Application Support/factorio/mods`,
    linux: `~/.factorio/mods`
}
/** @type {<T extends NodeJS.Platform>(platform: T)=>T extends 'win32' ? (typeof FactorioPath)['win'] : T extends 'linux' ? (typeof FactorioPath)['linux'] : T extends 'darwin' ? (typeof FactorioPath)['osx'] : any} */
function getPath(platform) {
    switch (platform) {
        case 'win32': return FactorioPath.win
        case 'linux': return FactorioPath.linux
        case 'darwin': return FactorioPath.osx
        default: throw 'platform not support'
    }
}
const name = `EnergyTechnology`

const { platform } = require('os')
const { parse, join, resolve } = require('path')
const { readdir, stat, copy } = require('fs-extra')
const trash = require('trash')

const info = require('./EnergyTechnology/info.json')
const version = info.version

/** @type {(typeof FactorioPath)['win'|'osx'|'linux']} */
const thePath = getPath(platform())
const dotnum = /\.\d/
    ;

(async () => {
    if (!(await stat(thePath)).isDirectory()) {
        throw `Factorio UserData Directory [ ${thePath} ] is not a Directory or not exist`
    }

    const needDelete = (await readdir(thePath)).filter(p => {
        if (parse(p).ext.match(dotnum) != null) {
            if (p.indexOf(name) >= 0)
                return true
        }
        return false
    }).map(p => join(thePath, p))

    await Promise.all(needDelete.map(de => (async () => {
        if (!(await stat(de)).isDirectory()) return
        await trash(de, { glob: false })
        console.info(`Removed [ ${de} ]`)
    })()))

    const fullLocal = resolve(`./${name}`)
    if (!(await stat(fullLocal)).isDirectory()) {
        throw `[ ${fullLocal} ] Not Find or not a Directory`
    }

    const targetPath = join(thePath, `${name}_${version}`)
    await copy(fullLocal, targetPath)

    console.log()

    console.log(`[ ${fullLocal} ]`)
    console.log('\tcopy to -->')
    console.log(`[ ${targetPath} ]`)
})()