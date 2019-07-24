/** @typedef {string | number} ImgPoint */
/** @typedef {'·'|'←'|'↖'|'↑'|'↗'|'→'|'↘'|'↓'|'↙'} AniPoint */
/** @typedef {{from:number, to:number, point?:AniPoint, width?: ImgPoint, height?: ImgPoint, x?: ImgPoint, y?: ImgPoint}} Ani */
/** @typedef {{type: 'animation', name:string, outname?:string, filename?: string, graphics?:string, outdir?:string, front?:Ani, back?:Ani, left?:Ani, right?:Ani, savetype: string}} Template*/
/** @type {Template} */
const template = {
    graphics: './graphics/',
    outdir: './',
    outname: '<name>.<direc>.png',
    filename: '<name>.<count pad={start,4}>.png',
    savetype: 'image/png'
    // name dsl
    // tag: name, count(only filename), direc
    // attr: pad={start, :number, ?:string}, pad={end, :number, ?:string}
    // direc attr: name={front, :string}, name={back, :string}, name={left, :string}, name={right, :string}
}
/** @type {Ani} */
const aniTemplate = {
    from: 0,
    to: 0,
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

const { dirname, join } = require('path')
const { ipcRenderer } = require('electron')
const { writeFile } = require('fs-extra')

const base64Head = /^data:image\/png;base64,/

/** @param {string} path * @param {Template} data */
async function Merge(path, data) {
    const dir = dirname(path)
    const graphics = join(dirname(path), data.graphics)
    const filename = genCode(parserName(data.filename), true)
    const outname = genCode(parserName(data.outname))

    /** @type {Promise[]} */
    const async = []
    if (typeof data.front === 'object') async.push(toMerge(graphics, data.front, count => filename({ name: data.name, direc: 'front', count }), join(dir, outname({ name: data.name, direc: 'front' })), data.savetype))
    if (typeof data.back === 'object') async.push(toMerge(graphics, data.back, count => filename({ name: data.name, direc: 'back', count }), join(dir, outname({ name: data.name, direc: 'back' })), data.savetype)) 
    if (typeof data.left === 'object') async.push(toMerge(graphics, data.left, count => filename({ name: data.name, direc: 'left', count }), join(dir, outname({ name: data.name, direc: 'left' })), data.savetype))
    if (typeof data.right === 'object') async.push(toMerge(graphics, data.right, count => filename({ name: data.name, direc: 'right', count }), join(dir, outname({ name: data.name, direc: 'right' })), data.savetype))

    await Promise.all(async)
}

/** @param {string} dir * @param {Ani} Ani * @param {(count: number)=>string} filename * @param {string} outname * @param {string} savetype*/
async function toMerge(dir, Ani, filename, outname, savetype) {
    //#region calc data

    /** @type {Promise<HTMLImageElement>[]} */
    const aimgs = []
    let Size = calcClosest(Math.abs(Ani.to - Ani.from)), [Width, Height] = Size
    for (let i = Ani.from; i <= Ani.to; i++) {
        const name = filename(i)
        aimgs.push(new Promise(res => {
            const img = document.createElement('img')
            img.src = join(dir, name)
            img.addEventListener('load', () => {
                res(img)
            })
        }))
    }
    const imgs = await Promise.all(aimgs)
    const imgSize = [imgs[0].width, imgs[0].height]
    const unitSize = [getPixel(Ani.width, imgSize[0]), getPixel(Ani.height, imgSize[1])]
    const offset = [getPixel(Ani.x, imgSize[0]), getPixel(Ani.y, imgSize[1])]
    if(Min(...Size) === Min(...unitSize)) {
        Size = [Width, Height] = [Height, Width]
    }
    const canvasSize = [Width * unitSize[0], Height * unitSize[1]]

    /** @type {CanvasRenderingContext2D} */
    const ctx = await new Promise(res => {
        const canvas = document.createElement('canvas')
        
        document.body.appendChild(canvas)   // debug


        canvas.width = canvasSize[0]
        canvas.height = canvasSize[1]
        res(canvas.getContext('2d'))
    })

    const edge = getEdge(unitSize, offset, Ani.point, imgSize)

    //#endregion

    //#region draw
    
    let left = 0, top = 0
    for (const img of imgs) {
        const [x, y, width, height] = [edge[0], edge[1], unitSize[0], unitSize[1]]

        ctx.drawImage(img, x, y, width, height, width * left, height * top, width, height)

        left++
        if(left >= Width) {
            left = 0
            top++
        }
    }

    //#endregion

    //#region save

    const url = ctx.canvas.toDataURL(savetype)
    const base64Data = url.replace(base64Head, '')
    
    await writeFile(outname, base64Data, 'base64')

    //#endregion
}

/** @param {number | string} val * @param {number} base */
function getPixel(val, base) {
    if (typeof val === 'number') return Math.round(val * base)
    const nv = parseFloat(val)
    if (isNaN(nv)) return nv
    if(typeof val === 'string') {
        if (val.length > 1, val[val.length - 1] === '%') {
            const p = nv / 100
            return Math.round(p * base)
        } else if (val.length > 2, val[val.length - 1] === 'x' && val[val.length - 2] === 'p') {
            return nv
        }
    }
    return Math.round(nv * base)
}

/** @param {[number, number]} * @param {[number, number]} * @param {AniPoint} point * @param {[number, number]} * @returns {[number,number,number,number]} */
function getEdge([width, height], [x, y], point, [W, H]) {
    switch (point) {
        case '↖': return [x, y, x + width, y + height]
        case '↗': return [W - x - width, y, W - x, y + height]
        case '↙': return [x, H - y - height, x + width, H - y]
        case '↘': return [W - x - width, H - y - height, W - x, H - y]
        case '←': return [x, Math.floor(H / 2) + y - Math.floor(height / 2), x + width, Math.floor(H / 2) + y + Math.floor(height / 2)]
        case '↑': return [Math.floor(W / 2) + x - Math.floor(width / 2), y, Math.floor(W / 2) + x + Math.floor(width / 2), y + height]
        case '→': return [W - x - width, Math.floor(H / 2) + y  - Math.floor(height / 2), W - x, Math.floor(H / 2) + y + Math.floor(height / 2)]
        case '↓': return [Math.floor(W / 2) + x - Math.floor(width / 2), H - y - height, Math.floor(W / 2) + x + Math.floor(width / 2), H - y]
        case '·': return [Math.floor(W / 2) + x - Math.floor(width / 2), Math.floor(H / 2) + y - Math.floor(height / 2), Math.floor(W / 2) + x + Math.floor(width / 2), Math.floor(H / 2) + y + Math.floor(height / 2)]
        default: UnknowType(point)
    }
}

/** @param {number} left * @param {number} right * @returns {'left'|'right'} */
function Min(left, right) {
    if (left < right) return 'left'
    else return 'right'
}

//#region Parser

/** @param {string} name */
function parserName(name) {
    const space = /\s/
    console.log(name)
    /** @typedef {{type: 'text', text: string[]}} AstText */
    /** @typedef {{type: 'tag', name: string[], endname: boolean, attrs: AstAttr[]}} AstTag */
    /** @typedef {{name: string[], endname: boolean, startparam: boolean, params: AstParam[]}} AstAttr */
    /** @typedef {{type: 'id' | 'stringS' | 'stringD',, text: string[]}} AstParam */
    /** @typedef {AstText | AstTag} Ast */
    /** @type {Ast[]} */
    const asts = []
    /** @type {Ast} */
    let now = null
    /** @type {AstAttr} */
    let nowAttr = null
    /** @type {AstParam} */
    let nowParam = null
    function finish(ast = null) {
        asts.push(now)
        now = ast
    }
    function finishAttr(attr = null) {
        now.attrs.push(nowAttr)
        nowAttr = attr
    }
    function finishParam(param = null) {
        nowAttr.params.push(nowParam)
        nowParam = param
    }
    for (const char of name) {
        function newText() {
            now = { type: 'text', text: [char] }
        }
        function addChar() {
            now.text.push(char)
        }
        if (char === '<') {     // <    start tag
            if (now != null) {
                if (now.type === 'tag') throw new SyntaxError('Duplicate <')    // <<
                else if (now.type === 'text') finish()  // t<
                else UnknowType()
            } now = { type: 'tag', name: [], endname: false, attrs: [] }    // <
        } else if (char === '>') {      // >
            if (now == null) { newText(); continue }    // >
            if (now.type === 'tag') {   // <n>
                if (now.endname && nowAttr != null) {   // <n a>
                    if (nowAttr.endname && !nowAttr.startparam) throw new SyntaxError('Parameter brackets are not start') // <n a=>
                    if (nowAttr.startparam && nowParam != null) throw new SyntaxError('Parameter brackets are not closed') // <n a={...>
                    finishAttr()
                }
                finish()
            }
            else if (now.type === 'text') addChar()     // t>
            else UnknowType()
        } else if (space.test(char)) {  // space
            if (now == null) { newText(); continue }    // ' '
            if (now.type === 'tag') {   // <...' '
                if (!now.endname) now.endname = true    // <n' '
                else continue   // <n ...' '
            }
            else if (now.type === 'text') addChar()     // t' '
            else UnknowType()
        } else if (char === '=') {
            if (now == null) { newText(); continue }    // =
            if (now.type === 'text') addChar()  // t=
            else if (now.type === 'tag') {  // <...=
                if (!now.endname) throw new SyntaxError('Missing attribute name')    // <n=
                else {
                    if (nowAttr.endname) throw new SyntaxError('Repeated =')    // <n a=...=
                    else if (nowAttr.name.length == 0) throw new SyntaxError('Missing attribute name')    // <n =
                    else nowAttr.endname = true  // <n a=
                }
            } else UnknowType()
        } else if (char === '{') {
            if (now == null) { newText(); continue }    // {
            if (now.type === 'text') addChar()  // t{
            else if (now.type === 'tag') {  // <...{
                if (!now.endname) throw new SyntaxError('Missing attribute name')    // <n{
                else {
                    if (nowAttr.name.length == 0) throw new SyntaxError('Missing attribute name')    // <n {
                    else if (!nowAttr.endname) throw new SyntaxError('Missing =')    // <n a{
                    else {
                        if (nowAttr.startparam) throw new SyntaxError('Repeated =')    // <n a={...{
                        nowAttr.startparam = true   // <n a={
                    }
                }
            } else UnknowType()
        } else if (char === '}') {
            if (now == null) { newText(); continue }    // }
            if (now.type === 'text') addChar()  // t}
            else if (now.type === 'tag') {  // <...}
                if (!now.endname) throw new SyntaxError('Missing attribute name')    // <n}
                else {
                    if (nowAttr.name.length == 0) throw new SyntaxError('Missing attribute name')    // <n }
                    else if (!nowAttr.endname) throw new SyntaxError('Missing ={')    // <n a}
                    else {
                        if (!nowAttr.startparam) throw new SyntaxError('Missing {')    // <n a=}
                        else { // <n a={...}
                            if (nowParam != null) finishParam()     // <n a={ppp}
                            finishAttr()
                        }  
                    }
                }
            }
            else UnknowType()
        } else if (char === ',') {
            if (now == null) { newText(); continue }    // ,
            if (now.type === 'text') addChar()  // t,
            else if (now.type === 'tag') {  // <...,
                if (!now.endname) throw new SyntaxError('Missing attribute name')    // <n,
                else {
                    if (nowAttr.name.length == 0) throw new SyntaxError('Missing attribute name')    // <n ,
                    else if (!nowAttr.endname) throw new SyntaxError('Missing ={')    // <n a,
                    else {
                        if (!nowAttr.startparam) throw new SyntaxError('Missing {')    // <n a=,
                        else {  // <n a={...,
                            if (nowParam != null) finishParam()     // <n a={ppp,
                            else continue   // <n a={,
                        }
                    }
                }
            }
            else UnknowType()
        } else if (char == "'") {
            if (now == null) { newText(); continue }    // '
            if (now.type === 'text') addChar()  // t'
            else if (now.type === 'tag') {  // <...'
                if (!now.endname) now.name.push(char)// <n'
                else {
                    if (nowAttr.name.length == 0) throw new SyntaxError('Missing attribute name')    // <n '
                    else if (!nowAttr.endname) throw new SyntaxError('Missing ={')    // <n a'
                    else {
                        if (!nowAttr.startparam) throw new SyntaxError('Missing {')    // <n a='
                        else {  // <n a={...'
                            if (nowParam != null) { // <n a={xppp'
                                if (nowParam.type === 'stringS') finishParam()  // <n a={'ppp'
                                else nowParam.text.push(char)
                            }     
                            else nowParam = { type: 'stringS', text: [] } // <n a={'
                        }
                    }
                }
            }
            else UnknowType()
        } else if (char == '"') {
            if (now == null) { newText(); continue }    // "
            if (now.type === 'text') addChar()  // t"
            else if (now.type === 'tag') {  // <..."
                if (!now.endname) now.name.push(char)// <n"
                else {
                    if (nowAttr.name.length == 0) throw new SyntaxError('Missing attribute name')    // <n "
                    else if (!nowAttr.endname) throw new SyntaxError('Missing ={')    // <n a"
                    else {
                        if (!nowAttr.startparam) throw new SyntaxError('Missing {')    // <n a="
                        else {  // <n a={..."
                            if (nowParam != null) { // <n a={xppp"
                                if (nowParam.type === 'stringD') finishParam()  // <n a={"ppp"
                                else nowParam.text.push(char)
                            }
                            else nowParam = { type: 'stringD', text: [] } // <n a={"
                        }
                    }
                }
            }
            else UnknowType()
        } else {    // other
            if (now == null) { newText(); continue }    // x
            if (now.type === 'text') addChar()  // tx
            else if (now.type === 'tag') {  // <...x
                if (now.endname) {  //<n ...x
                    if (nowAttr == null) nowAttr = { name: [char], endname: false, startparam: false, params: [] }  //<n a
                    else {
                        if (nowAttr.endname) {  // <n a=...x
                            if (nowAttr.startparam) {   // <n a={...x
                                if (nowParam == null) nowParam = { type: 'id', text: [char] }   // <n a={x
                                else nowParam.text.push(char)   // <n a={px
                            } else throw new SyntaxError('Parameter brackets are not start') // <n a=x
                        } else nowAttr.name.push(char)  //<n ax
                    }
                } else now.name.push(char)   // <nx
            } else UnknowType()
        }
    }
    if (now != null) finish()
    return asts
}

/** @param {ReturnType<parserName>} asts @param {boolean} canCount  */
function genCode(asts, canCount = false) {
    /** @typedef {{name: string[], endname: boolean, startparam: boolean, params: AstParam[]}} AstAttr */
    /** @typedef {{type: 'id' | 'stringS' | 'stringD',, text: string[]}} AstParam */
    /** @typedef {{name: string, count: string, direc: string}} Ctx */

    /** @param {AstParam[]} params @returns {({type: 'string': val: string} | {type: 'id', val: string} | {type: 'number', val: number})[]} */
    function checkParam(params) {
        return params.map(param => {
            if (param.type === 'stringD' || param.type === 'stringS') {
                return { type: 'string', val: param.text.join('') }
            } else if(param.type === 'id') {
                const id = param.text.join('')
                const num = parseFloat(id)
                if (isNaN(num)) return { type: 'id', val: id }
                else return { type: 'number', val: num }
            } else UnknowParam(param.type)
        })
    }

    /** @param {AstAttr[]} attrs @returns {(text: string) => string} */
    function genAttr(attrs, isCount = false, canDirec = false) {
        /** @type {((text: string) => string)[]} */
        const newAttr = attrs.flatMap(attr => {
            const name = attr.name.join('')
            if (name === 'pad') {
                const [di, val, str] = checkParam(attr.params)
                if (di == null || di.type !== 'id' || val == null || val.type !== 'number') return []
                if (str != null && str.type === 'string') {
                    if (di.val === 'start') {
                        return /** @param {string} text */ text => `${text}`.padStart(val.val, str.val)
                    } else if (di.val === 'end') {
                        return /** @param {string} text */ text => `${text}`.padEnd(val.val, str.val)
                    } else return []
                } else {
                    if (di.val === 'start') {
                        return /** @param {string} text */ text => `${text}`.padStart(val.val, isCount ? '0' :'_')
                    } else if (di.val === 'end') {
                        return /** @param {string} text */ text => `${text}`.padEnd(val.val, isCount ? '0' : '_')
                    } else return []
                }
            } else if (canDirec && name === 'name') {
                const [di, val] = checkParam(attr.params)
                if (di == null || di.type !== 'id' || val == null || val.type !== 'number') return []
                const dival = di.val
                return /** @param {string} text */ text => dival === text ? val : text
            } else UnknowAttr(name)
        })
        return text => newAttr.reduce((last, fn) => fn(last), `${text}`)
    }

    /** @type {(string | ((ctx: Ctx) => string))[]} */
    const newAst = asts.map(ast => {
        if (ast.type === 'text') {
            return ast.text.join('')
        } else if (ast.type === 'tag') {
            const name = ast.name.join('')
            if (name === 'name') {
                const attr = genAttr(ast.attrs)
                return ({ name }) => attr(name)
            } else if (canCount && name === 'count') {
                const attr = genAttr(ast.attrs, true)
                return ({ count }) => attr(count)
            } else if (name === 'direc') {
                const attr = genAttr(ast.attrs, false, true)
                return ({ direc }) => attr(direc)
            } else UnknowTag(name)
        } else UnknowType(ast.type)
    })

    return /** @param {Ctx} ctx */ ctx => {
        return newAst.map(v => typeof v === 'function' ? v(ctx) : `${v}`).join('')
    }
}

/** @param {string} type @returns {never} */
function UnknowType(type) { throw new TypeError(`Unknow Type [${type}]`) }
/** @param {string} tag @returns {never} */
function UnknowTag(tag) { throw new TypeError(`Unknow Tag [${tag}]`) }
/** @param {string} attr @returns {never} */
function UnknowAttr(attr) { throw new TypeError(`Unknow Attr [${attr}]`) }
/** @param {string} param @returns {never} */
function UnknowParam(param) { throw new TypeError(`Unknow Param Type [${param}]`) }

//#endregion

ipcRenderer.on('do', async (_, path, data) => {
    try {
        await ani(path, data)
    } catch (e) {
        new Notification('Error!', {
            body: e,
        })
        console.error(e)
    } finally {
        window.close()
    }
})