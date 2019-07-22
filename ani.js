/** @typedef {string | number} ImgPoint */
/** @typedef {'·'|'←'|'↖'|'↑'|'↗'|'→'|'↘'|'↓'|'↙'} AniPoint */
/** @typedef {{from:number, to:number, point?:AniPoint, width?: ImgPoint, height?: ImgPoint, x?: ImgPoint, y?: ImgPoint}} Ani */
/** @typedef {{type: 'animation', name:string, outname?:string, filename?: string, graphics?:string, outdir?:string, front?:Ani, back?:Ani, left?:Ani, right?:Ani}} Template*/
/** @type {Template} */
const template = {
    graphics: './graphics/',
    outdir: './',
    outname: '<name>.<direc>.png',
    filename: '<name>.<count pad={start,4}>.png',
    // name dsl
    // tag: name, count(only filename), direc
    // attr: pad={start, :number, ?:string}, pad={end, :number, ?:string}
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
    const asts = parserName(data.filename)
    const filename = genCode(asts, true)
    console.log(filename)
    console.log(filename({ count: 1, name: 'fuck', direc: 'asd' }))
    if (typeof data.front === 'object') await toMerge(dir, data.front)
    // if (typeof data.back === 'object') await toMerge(dir, data.back)
    // if (typeof data.left === 'object') await toMerge(dir, data.left)
    // if (typeof data.right === 'object') await toMerge(dir, data.right)
}

/** @param {string} dir * @param {Ani} Ani */
async function toMerge(dir, Ani) {

}

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
        return text => {
            let rval = `${text}`
            for (const fn of newAttr) {
                rval = fn(rval)
            }
            return rval
        }
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

ipcRenderer.on('do', async (_, path, data) => {
    await ani(path, data)
    //window.close()
})