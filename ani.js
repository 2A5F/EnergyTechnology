/** @typedef {string | number} ImgPoint */
/** @typedef {'·'|'←'|'↖'|'↑'|'↗'|'→'|'↘'|'↓'|'↙'} AniPoint */
/** @typedef {{from:number, to:number, point?:AniPoint, width?: ImgPoint, height?: ImgPoint, x?: ImgPoint, y?: ImgPoint}} Ani */
/** @typedef {{type: 'animation', name:string, outname?:string, graphics?:string, outdir?:string, front?:Ani, back?:Ani, left?:Ani, right?:Ani}} Template*/
/** @type {Template} */
const template = {
    graphics: './graphics/',
    outdir: './',
    filename: '<name>.<count pad={start,4}>.png',
    // filename dsl
    // tag: name, count, direc
    // attr: pad={start, :number}, pad={end, :number}
    // direc attr: name={front, :string}, name={back, :string}, name={left, :string}, name={right, :string}
}
/** @type {Ani} */
const aniTemplate = {
    point: '·',
    width: 1,
    height: 1,
    x: 0,
    y: 0
}

/** @param {string} path * @param {Template} data */
async function ani(path, data) {
    if (typeof data !== 'object') throw `[${path}]\tData not a object`
    if (isObject(data.front)) data.front = SetTemplate(aniTemplate, data.front)
    if (isObject(data.back)) data.back = SetTemplate(aniTemplate, data.back)
    if (isObject(data.left)) data.left = SetTemplate(aniTemplate, data.left)
    if (isObject(data.right)) data.right = SetTemplate(aniTemplate, data.right)
    data = SetTemplate(template, data)
    console.log(path, data)
    await Merge(path, data)
}

function isObject(obj) {
    return typeof obj === 'object'
}

/** @template {Template | Ani} T * @param {T} template * @param {T} obj * @returns {T} */
function SetTemplate(template, obj) {
    const a = Object.create(template)
    return Object.assign(a, obj)
}

/** `20 ->  [4, 5]`  
 *  `5  ->  [1, 5]`  
 *  `16 ->  [4, 4]` */
/** @param {number} count @returns {[number, number]} `[x, y]`*/
function calcClosest(count) {
    if (count == Infinity) return [Infinity, Infinity]
    count = parseInt(count)
    if (isNaN(count)) throw 'Not A Number'
    if (count < 0) count = Math.abs(count)
    if (count == 1) return [1, 1]
    let min = Infinity
    /** @type {[number, number]} * **[distance, x, y]** */
    let out = [NaN, NaN]
    for (let x = 1; x < count; x++) {
        if (count % x !== 0) continue
        const y = count / x
        const d = Math.abs(x - y)
        if (d === 0) {
            return [x, y]
        }
        if (d < min) {
            min = d
            out = [x, y]
        }
    }
    if (min === Infinity) throw 'No factor, no integer solution'
    return out
}

const { dirname } = require('path')
const { ipcRenderer } = require('electron')

/** @param {string} path * @param {Template} data */
async function Merge(path, data) {
    const dir = dirname(path)
    console.log(dir)
    console.log(document)
}

/** @param {string} dir * @param {Ani} Ani */
async function toMerge(dir, Ani) {

}

ipcRenderer.on('do', (_, path, data) => {
    ani(path, data)
})