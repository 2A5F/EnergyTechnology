
const { app, BrowserWindow } = require('electron')
const { readFile } = require('fs-extra')

process.on('message', /** @param {[string, any][]} maybeData */ async maybeData => {
    await app.whenReady()
    await Promise.all(maybeData.map(d => checkData(...d)))
    app.quit()
})

/** @param {string} path * @param {any} data */
async function checkData(path, data) {
    if (data == null || typeof data != 'object') return
    if (data.type == null || typeof data.type != 'string') return
    switch (data.type) {
        case 'animation': await doData('./ani.js', path, data); break
    }
}

/** @param {string} mod * @param {string} path * @param {any} data */
async function doData(mod, path, data) {
    const win = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    })
    win.loadFile('./empty.html')
    win.webContents.openDevTools()
    await win.webContents.executeJavaScript(`require(${JSON.stringify(`${mod}`)})`)
    win.webContents.send('do', path, data)
    await new Promise(res => win.on('closed', res))
}

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit()
    }
})