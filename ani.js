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
    parserName(data.filename)
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
    function UnknowType() {
        throw new TypeError('Unknow Type')
    }
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
    console.log(asts)
}

ipcRenderer.on('do', async (_, path, data) => {
    await ani(path, data)
    //window.close()
})