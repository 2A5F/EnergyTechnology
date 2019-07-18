/** @typedef {string | number} ImgPoint */
/** @typedef {'·'|'←'|'↖'|'↑'|'↗'|'→'|'↘'|'↓'|'↙'} AniPoint */
/** @typedef {{from:number, to:number, point?:AniPoint, width?: ImgPoint, height?: ImgPoint, x?: ImgPoint, y?: ImgPoint}} Ani */
/** @typedef {{type: 'animation', name:string, outname?:string, graphics?:string, outdir?:string, front?:Ani, back?:Ani, left?:Ani, right?:Ani}} Template*/
/** @type {Template} */
const template = {
    graphics: './graphics/',
    outdir: './'
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
    console.log(path, data)

}

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

module.exports = {
    ani
}