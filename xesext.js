// ==UserScript==
// @name         XesExt
// @namespace    http://github.com/FurryR/XesExt
// @version      0.1.22
// @description  Much Better than Original - 学而思功能增强
// @license      GPL-3.0
// @author       凌
// @run-at       document-start
// @match        https://code.xueersi.com/*
// @icon         https://code.xueersi.com/static/images/code-home/qrlogo.png
// @grant        none
// ==/UserScript==
'use strict'
/*
Copyright(c) 2021 FurryR
此程序基于 GPL-3.0 开源。
*/
// xterm-original from xtermjs.org
const xterm_theme = {
    foreground: '#F8F8F8',
    background: '#2D2E2C',
    selection: '#5DA5D533',
    black: '#1E1E1D',
    brightBlack: '#262625',
    red: '#CE5C5C',
    brightRed: '#FF7272',
    green: '#5BCC5B',
    brightGreen: '#72FF72',
    yellow: '#CCCC5B',
    brightYellow: '#FFFF72',
    blue: '#5D5DD3',
    brightBlue: '#7279FF',
    magenta: '#BC5ED1',
    brightMagenta: '#E572FF',
    cyan: '#5DA5D5',
    brightCyan: '#72F0FF',
    white: '#F8F8F8',
    brightWhite: '#FFFFFF'
}
// [审查用]取得直链
function getScratchlink(id, version, type) {
    let ret = ''
    if (type == 'scratch') {
        ret = `https://code.xueersi.com/scratch/index.html?pid=${id}&version=${version}&env=community`
    if (version == '2.0') {
        if (id.indexOf('8080') != -1) {
            ret = `http://dev-code.xueersi.com/scratch/index.html?pid=${id}&version=${version}&env=community`
      }
    } else {
        if (id.indexOf('8080') != -1) {
            ret = `http://dev-code.xueersi.com/scratch3/index.html?pid=${id}&version=${version}&env=community`
      } else {
          ret = `https://code.xueersi.com/scratch3/index.html?pid=${id}&version=${version}&env=community`
      }
    }
    } else if (type == 'cpp' || type == 'webpy' || type == 'python') {
        ret = `https://code.xueersi.com/ide/code/${id}`
  }
    return ret
}
// [审查用]获得当前作品的各种配置
function getPropertyByUrl() {
    const href = window.location.href
    if (href.indexOf('/codenoheader/') != -1) {
        // https://code.xueersi.com/ide/codenoheader/(...)
        const tmp = /\/codenoheader\/[0-9]+\?/.exec(href)[0].substring('/codenoheader/'.length)
        return [tmp.substring(0, tmp.length - 1), 'cpp', 'cpp']
    } else if (href.indexOf('/player.html') != -1) {
        // https://code.xueersi.com/scratch3/player.html?pid=(...)&version=3.0&env=player&fullScreen=false&is_player=true
        return [/pid=[0-9]+/.exec(href)[0].substring('pid='.length), /version=([a-z]|[A-Z]|[0-9])+/.exec(href)[0].substring('version='.length), 'scratch']
    } else if (href.indexOf('/m/course-detail') != -1) {
        // https://code.xueersi.com/m/course-detail?id=(...)&lang=(...)
        const lang = /lang=([a-z]|[A-Z]|[0-9])+/.exec(href)[0].substring('lang='.length)
        return [/id=[0-9]+/.exec(href)[0].substring('id='.length), lang, lang]
    } else if (href.indexOf('/ide/code/') != -1) {
        // https://code.xueersi.com/ide/code/(...)
        return [/\/ide\/code\/[0-9]+/.exec(href)[0].substring('/ide/code/'.length), 'cpp', 'cpp']
    } else if (href.indexOf('/project/publish/modal') != -1) {
        // https://code.xueersi.com/project/publish/modal?pid=(...)&id=(...)&lang=(...)
        const lang = /lang=([a-z]|[A-Z]|[0-9])+/.exec(href)[0].substring('lang='.length)
        return [/id=[0-9]+/.exec(href)[0].substring('id='.length), lang, lang]
    } else if (href.indexOf('/home/project/detail') != -1) {
        const pid = /pid=[0-9]+/.exec(href)[0].substring('pid='.length)
        const version = /version=([a-z]|[A-Z]|[0-9])+/.exec(href)[0].substring('version='.length)
        const type = /langType=([a-z]|[A-Z]|[0-9])+/.exec(href)[0].substring('langType='.length)
        return [pid, version, type]
    }
    return null
}
// [通用]寻找内容为content的elem类型的标签
function searchElem(elem, content) {
    const matches = []
    for (const v of document.getElementsByTagName(elem)) {
        if (v.textContent.includes(content)) {
            matches.push(v)
        }
    }
    return matches
}
function lightinit() {
    /// 删除猫博士的开眼课堂和老师们的作品[重制版] by 凌
    const keduo_wrapper = document.getElementById('homePageKeduoGuide')
    if (keduo_wrapper) {
        console.warn('XesExt patched homePageKeduoGuide div')
        keduo_wrapper.remove()
    }
    const floorbarwrapper = document.getElementsByClassName('floor-bar-wrapper')
    if (floorbarwrapper.length == 1) {
        console.warn('XesExt patched floor-bar-wrapper div')
        floorbarwrapper[0].remove()
    }
}
(function () {
    window.addEventListener('load', () => {
        if (window.location.href.indexOf('xueersi.com') == -1) {
            console.warn(`XesExt prevented in ${window.loadtion.href}`)
            return
        }
        console.warn('XesExt init')
        /// 变更改编按钮行为 by 凌
        const adaptButton = document.getElementsByClassName('adapt')
        if (adaptButton.length == 1) {
            console.warn('XesExt patched adapt btn')
            adaptButton[0].replaceWith(adaptButton[0].cloneNode(true))
            adaptButton[0].childNodes[1].data = ' 审查 '
            adaptButton[0].addEventListener('click', (ev) => {
                window.open(getScratchlink.apply(null, getPropertyByUrl()), '_blank')
                ev.preventDefault()
            })
        } else {
            const notAllowAdaptButton = document.getElementsByClassName('tooltip')
            if (notAllowAdaptButton.length == 1) {
                console.warn('XesExt patched disabled adapt btn')
                notAllowAdaptButton[0].replaceWith(notAllowAdaptButton[0].cloneNode(true))
                notAllowAdaptButton[0].childNodes[0].className = 'adapt'
                notAllowAdaptButton[0].childNodes[0].childNodes[0].className = 'never-adapt'
                notAllowAdaptButton[0].childNodes[0].childNodes[1].data = ' 审查 '
                for (const i of notAllowAdaptButton[0].childNodes) {
                    notAllowAdaptButton[0].parentNode.appendChild(i)
                }
                notAllowAdaptButton[0].remove()
                const parent = document.getElementsByClassName('not-allow-adapt')
                if (parent.length == 1) {
                    for (const i of parent[0].childNodes) {
                        parent[0].parentNode.insertBefore(i, parent[0])
                    }
                    parent[0].remove()
                }
                document.getElementsByClassName('adapt')[0].addEventListener('click', (ev) => {
                    window.open(getScratchlink.apply(null, getPropertyByUrl()), '_blank')
                    ev.preventDefault()
                })
            }
        }
        /// 删除社区公约 by 凌
        const rule = document.getElementsByClassName('rule')
        if (rule.length == 1) {
            console.warn('XesExt patched rule btn')
            rule[0].remove()
        }
        /// [编辑器模式] 去除模板按钮 by 凌
        const btn = searchElem('a', ' 模板 ')
        if (btn.length == 1) {
            console.warn('XesExt patched template btn')
            btn[0].remove()
        }
        /// [编辑器模式] 去除编程百科按钮 by 凌
        const wiki = searchElem('a', ' 编程百科 ')
        if (wiki.length == 1) {
            console.warn('XesExt patched wiki btn')
            wiki[0].remove()
        }
        /// 删除或替换字体大小按钮 by 凌
        /// 注：在编辑器模式下，字体大小按钮将被替换为主题按钮。
        const textsize = document.getElementsByClassName('btn-font-size')
        if (textsize.length == 1) {
            console.warn('XesExt patched textsize div')
            if (window.aceEditor && window.location.pathname.startsWith('/ide/code/')) {
                for (const d of textsize[0].childNodes) {
                    textsize[0].removeChild(d)
                }
                textsize[0].replaceWith(textsize[0].cloneNode(true))
                textsize[0].textContent = ' T '
                textsize[0].addEventListener('click', (ev) => {
                    const t = prompt(`输入新的主题 ID(比如 ace/theme/tomorrow_night):`, window.aceEditor.getTheme())
                    if (t) {
                        console.warn(`XesExt Switch theme to ${t}`)
                        window.localStorage.setItem('__xesext_theme', t)
                        window.aceEditor.setTheme(t)
                    }
                    ev.preventDefault()
                })
            } else {
                textsize[0].remove()
            }
        }
        /// [独占][Pro][编辑器模式] 更换主题 by 凌
        const editor = document.getElementsByClassName('ace-editor tile is-child box ace_editor ace-tm')
        if (editor.length == 1) {
            console.warn('XesExt patched editor div')
            editor[0].attributes.removeNamedItem(editor[0].attributes[0].name)
            editor[0].className = 'ace-editor tile is-child ace_editor ace-tm'
        }
        const gutterLayer = document.getElementsByClassName('ace_layer ace_gutter-layer')
        if (gutterLayer.length == 1) {
            console.warn('XesExt patched gutter-layer div')
            gutterLayer[0].className = gutterLayer[0].className.replace('ace_gutter-layer', '')
        }
        // 从 localStorage 读入
        if (window.aceEditor) {
            console.warn('XesExt patched ace editor')
            const g = window.localStorage.getItem('__xesext_theme')
            if (g) {
                console.warn(`XesExt Switch theme to ${g}`)
                window.aceEditor.setTheme(g)
            } else {
                console.warn('XesExt Switch theme to ace/theme/tomorrow_night')
                window.localStorage.setItem('__xesext_theme', 'ace/theme/tomorrow_night')
                window.aceEditor.setTheme('ace/theme/tomorrow_night')
            }
        }
        /// [独占][作品模式]防止强制点赞
        const likebtn = document.querySelector('.like')
        if (likebtn) {
            console.warn('XesExt patched like btn')
            likebtn.click = () => {
                console.error('XesExt 检测到点赞按钮被触发。此作品可能含有刷赞代码。')
            }
        }
        const favbtn = document.querySelector('.favorites')
        if (favbtn) {
            console.warn('XesExt patched favorite btn')
            favbtn.click = () => {
                console.error('XesExt 检测到收藏按钮被触发。此作品可能含有刷赞代码。')
            }
        }
        const followbtn = document.querySelector('.focus-btn')
        if (followbtn) {
            console.warn('XesExt patched follow btn')
            followbtn.click = () => {
                console.error('XesExt 检测到关注按钮被触发。此作品可能含有刷赞代码。')
            }
        }
        /// 更好的反跟踪 by 凌
        if (window.logger) {
            console.warn('XesExt patched object logger')
            for (const v in window.logger) {
                window.logger[v] = () => {}
            }
        }
        if (window.__XES_LOG__) {
            console.warn('XesExt patched object __XES_LOG__')
            for (const v in window.__XES_LOG__) {
                window.__XES_LOG__[v] = () => {}
            }
        }
        if (window.XesInstance) {
            console.warn('XesExt patched object XesInstance')
            for (const v in window.XesInstance) {
                window.XesInstance[v] = () => {}
            }
        }
        if (window.Xes) {
            console.warn('XesExt patched object Xes')
            for (const v in window.Xes) {
                window.Xes[v] = () => {}
            }
        }
        if (window.XesLoggerSDK) {
            console.warn('XesExt patched fn window.XesLoggerSDK')
            window.XesLoggerSDK = function () {}
        }
        /// Light init
        document.body.addEventListener('DOMNodeInserted', () => lightinit())
        lightinit()
        /// 初始化完成
        console.warn('XesExt post-init')
    })
    console.warn('XesExt pre-init')
    /// 更好的反跟踪 提前初始化 by 凌
    /// 去开屏广告 by 凌
    /// [独占][Pro] 访问已删除的作品 by 凌
    /// 删除猫博士的开眼课堂和老师们的作品[重制版] by 凌
    console.warn('XesExt patched object XMLHttpRequest')
    const _open = window.XMLHttpRequest.prototype.open
    const project = getPropertyByUrl()
    const _base_open = function (e, t, n) {
        if (t.includes('dj.xesimg.com')) {
            console.warn('XesExt patched dj.xesimg.com XHR')
            _open.call(this, e, this.__xes_url = 'data:application/json,{}', n)
        } else if (t.startsWith('/api/pop/show/')) {
            console.warn('XesExt patched /api/pop/show XHR')
            _open.call(this, e, this.__xes_url = 'data:application/json,{"stat":1,"status":1,"msg":"","data":{"id":-1,"type":"normal","ads":[],"force":0,"open":1}}', n)
        } else if (t.startsWith('/api/index/works/modules')) {
            console.warn('XesExt patched /api/index/works/modules XHR')
            _open.call(this, e, this.__xes_url = 'data:application/json,{"stat":1,"status":1,"msg":"操作成功","data":[{"title":"可多推荐","simple_title":"可多推荐","lines":2,"items":[]},{"title":"我的关注","simple_title":"我的关注","lines":2,"items":[]},{"title":"猜你喜欢","simple_title":"猜你喜欢","lines":2,"items":[]}]}', n)
        } else {
            _open.call(this, e, t, n)
        }
    }
    if (project) {
        console.warn('XesExt is running in project page')
        /// [独占][Pro][Beta] 升级 xterm by 凌
        // 连字特性未启用 ('xterm-addon-ligatures.js') 原因:Lightpad
        ;['xterm.js', 'xterm-addon-webgl.js', 'xterm-addon-canvas.js', 'xterm-addon-unicode11.js', 'xterm-addon-ligatures.js', 'xterm-addon-fit.js', 'xterm.css'].forEach(e => {
            if (e.endsWith(".js")) {
                const script = document.createElement('script')
                script.src = `https://furryr.github.io/xtermjs-build/js/${e}`
              document.head.appendChild(script)
            } else {
                const css = document.createElement('link')
                css.href = `https://furryr.github.io/xtermjs-build/css/${e}`
              css.type = 'text/css'
                css.rel = 'stylesheet'
                document.head.appendChild(css)
            }
        })
        let newref = undefined
        Object.defineProperty(window, "refWsTerm", {
            get() {
                return newref
            },
            set(e) {
                if (newref == undefined) {
                    newref = e
                    const xterm = document.getElementById('terminal')
                    if (xterm) {
                        // 背景修补
                        xterm.style.backgroundColor = xterm.parentNode.style.backgroundColor = xterm_theme.background
                        const term = new window.Terminal({
                            fontSize: 15,
                            fontFamily: '"Jetbrains Mono", "Fira Code", "Cascadia Code", "Noto Emoji", "Segoe UI Emoji", "Lucida Console", Menlo, courier-new, courier, monospace',
                            theme: xterm_theme,
                            cursorBlink: true,
                            allowProposedApi: true
                        })
                        term.open(xterm)
                        // WebGL 加速
                        try {
                            try {
                                const webgl = new window.WebglAddon.WebglAddon()
                                term.loadAddon(webgl)
                            } catch (_) {
                                const canvas = new window.CanvasAddon.CanvasAddon()
                                term.loadAddon(canvas)
                            }
                            const unicode = new window.Unicode11Addon.Unicode11Addon()
                            // const ligatures = new window.LigaturesAddon.LigaturesAddon()
                            const fit = new window.FitAddon.FitAddon()
                            term.loadAddon(unicode)
                            // term.loadAddon(ligatures)
                            term.loadAddon(fit)
                            term.fit = () => fit.fit()
                            term.on = (e, f) => {
                                // 为以前版本的兼容性作处理。
                                switch (e) {
                                    case 'data': {
                                        term.onData(f)
                                        break
                                    }
                                    case 'resize': {
                                        term.onResize(f)
                                        break
                                    }
                                }
                            }
                            term.off = (e) => {
                                // 为以前版本的兼容性作处理。
                                switch (e) {
                                    case 'data': {
                                        term.onData(() => {})
                                        break
                                    }
                                    case 'resize': {
                                        term.onResize(() => {})
                                        break
                                    }
                                }
                            }
                            for (const [key, value] of Object.entries(newref.xterm.term._core._events)) {
                                term.on(key, (...args) => {
                                    value.forEach(v => {
                                        v(...args)
                                    })
                                })
                            }
                            term.setOption = (k, v) => {
                                // 为以前版本的兼容性作处理。
                                term.options[k] = v
                            }
                            term.unicode.activeVersion = '11'
                        } catch (e) {
                            console.error('[XesExt-xterm] Load addons failed', e)
                        }
                        // 阻止滚轮事件滚动页面
                        xterm.childNodes[0].addEventListener('wheel', e => {
                            // if (term.buffer.active.baseY > 0) {
                            e.preventDefault()
                            // }
                        })
                        xterm.addEventListener('wheel', e => {
                            e.preventDefault()
                        })
                        // 修正滑动条占位
                        xterm.childNodes[0].overflowY = 'scroll'
                        newref.xterm.close()
                        newref.xterm.term = term
                    }
                } else {
                    newref = e
                }
            }
        })
        console.warn('XesExt patched window.refWsTerm')
        window.XMLHttpRequest.prototype.open = function (e, t, n) {
            this.__xes_url = t
            if (t.startsWith(`/api/compilers/v2/${project[0]}`) && this.__xes_disableFilter != true) {
                console.warn(`XesExt replaced /api/compilers/v2/${project[0]} request`)
                // 最差的解决办法...有办法变成异步么？
                const tmp = new XMLHttpRequest()
                tmp.__xes_disableFilter = true
                tmp.open(e, t, false)
                tmp.send()
                if (tmp.status != 200) {
                    this.__xes_url = `/api/community/v4/projects/detail?id=${project[0]}&lang=${project[2]}`
          _open.call(this, e, this.__xes_url, n)
                } else {
                    this.__xes_subreq = true
                    Object.defineProperty(this, 'status', {
                        get: () => tmp.status
                    })
                    Object.defineProperty(this, 'response', {
                        get: () => tmp.response
                    })
                    Object.defineProperty(this, 'statusText', {
                        get: () => tmp.statusText
                    })
                    Object.defineProperty(this, 'responseText', {
                        get: () => tmp.responseText
                    })
                    _open.call(this, e, this.__xes_url = 'data:application/json,{}', n)
                }
            } else _base_open.call(this, e, t, n)
        }
    } else {
        console.warn('XesExt is running in non-project page')
        window.XMLHttpRequest.prototype.open = function (e, t, n) {
            this.__xes_url = t
            _base_open.call(this, e, t, n)
        }
    }
    // 6，非得让你污染原型链不可。学而思前端还是趁早辞职吧？
    console.warn('XesExt patched window.XMLHttpRequest.prototype.open')
    /// 删除作品运行间隔 by 凌
    const _setTimeout = window.setTimeout
    window.setTimeout = (code, delay, ...args) => {
        if (code.toString().indexOf('fnTryLockRun') != -1 || code.toString().indexOf('document.getElementById(\'loading-dom\').style.display') != -1) {
            code()
            return -1
        }
        // console.error(code, delay)
        return _setTimeout(code, delay, ...args)
    }
    console.log('XesExt patched window.setTimeout')
})()
