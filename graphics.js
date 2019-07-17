/**@template T @typedef {T extends Promise<infer R> ? R : any} UnPromise */
/**@typedef {{path: string, state: UnPromise<ReturnType<typeof stat>>}} Status */

const root = './EnergyTechnology/graphics/'

const { join, extname } = require('path')
const { readdir, stat } = require('fs-extra')

/** @type {{ ani(path: string): Promise<void> }} */
const { ani } = require('./ani')

/** @param {string} dir*/
async function findAllJs(dir) {
    /** @type {string[]} */
    const arr = []
    const newpath = (await readdir(dir)).map(name => `./${join(dir, name)}`)
    const status = await Promise.all(newpath.map(async np => ({
        path: np,
        state: await stat(np)
    })))
    /** @type {Promise<string[]>[]} */
    const aarr = []
    for (const st of status) {
        if (isJs(st)) arr.push(st.path)
        else if (st.state.isDirectory()) {
            aarr.push(findAllJs(st.path))
        }
    }
    for (const narr of await Promise.all(aarr)) {
        arr.push(...narr)
    }
    return arr
}

/** @param {Status} */
function isJs({path, state}) {
    return state.isFile() && extname(path) === '.js'
}

(async () => {
    const r = await Promise.all((await findAllJs(root)).map(ani))
})()