// ==UserScript==
// @name         XesExt
// @namespace    http://github.com/FurryR/XesExt
// @version      2.0.1
// @description  Much Better than Original - 学而思功能增强
// @license      GPL-3.0
// @author       凌
// @run-at       document-start
// @match        https://code.xueersi.com/*
// @icon         https://code.xueersi.com/static/images/code-home/qrlogo.png
// @grant        none
// ==/UserScript==
'use strict'
/**
 * Copyright(c) 2021 FurryR
 * 此程序基于 GPL-3.0 开源。
 */
// [审查用]取得直链
function getScratchlink(id, version, type) {
  let ret = ''
  if (type == 'scratch') {
    ret = `https://code.xueersi.com/scratch/index.html?pid=${id}&version=${version}&env=community`
    if (version == '2.0') {
      if (id.includes('8080')) {
        ret = `http://dev-code.xueersi.com/scratch/index.html?pid=${id}&version=${version}&env=community`
      }
    } else {
      if (id.includes('8080')) {
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
  if (href.includes('/codenoheader/')) {
    // https://code.xueersi.com/ide/codenoheader/(...)
    const tmp = /\/codenoheader\/[0-9]+\?/
      .exec(href)[0]
      .substring('/codenoheader/'.length)
    return [tmp.substring(0, tmp.length - 1), 'cpp', 'cpp']
  } else if (href.includes('/player.html')) {
    // https://code.xueersi.com/scratch3/player.html?pid=(...)&version=3.0&env=player&fullScreen=false&is_player=true
    return [
      /pid=[0-9]+/.exec(href)[0].substring('pid='.length),
      /version=([a-z]|[A-Z]|[0-9])+/.exec(href)[0].substring('version='.length),
      'scratch'
    ]
  } else if (href.includes('/m/course-detail')) {
    // https://code.xueersi.com/m/course-detail?id=(...)&lang=(...)
    const lang = /lang=([a-z]|[A-Z]|[0-9])+/
      .exec(href)[0]
      .substring('lang='.length)
    return [/id=[0-9]+/.exec(href)[0].substring('id='.length), lang, lang]
  } else if (href.includes('/ide/code/')) {
    // https://code.xueersi.com/ide/code/(...)
    return [
      /\/ide\/code\/[0-9]+/.exec(href)[0].substring('/ide/code/'.length),
      'cpp',
      'cpp'
    ]
  } else if (href.includes('/project/publish/modal')) {
    // https://code.xueersi.com/project/publish/modal?pid=(...)&id=(...)&lang=(...)
    const lang = /lang=([a-z]|[A-Z]|[0-9])+/
      .exec(href)[0]
      .substring('lang='.length)
    return [/id=[0-9]+/.exec(href)[0].substring('id='.length), lang, lang]
  } else if (href.includes('/home/project/detail')) {
    const pid = /pid=[0-9]+/.exec(href)[0].substring('pid='.length)
    const version = /version=([a-z]|[A-Z]|[0-9])+/
      .exec(href)[0]
      .substring('version='.length)
    const type = /langType=([a-z]|[A-Z]|[0-9])+/
      .exec(href)[0]
      .substring('langType='.length)
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
const CODEFONT_CSS =
  'color: white; font-family: "Jetbrains Mono", "Fira Code", Consolas, "Courier New", monospace'
const logger = {
  warn: console.warn,
  clear: console.clear,
  error: console.error,
  table: console.table,
  trace: console.trace
}
const patch = {
  document: {
    /**
     * 在页面加载完毕后的触发器。
     * @param {() => void} fn
     */
    load: fn => void document.addEventListener('load', fn, true),
    /**
     * 在页面加载前的触发器。
     * @param {() => void} fn
     */
    start: fn => void fn(),
    /**
     * 在页面插入节点之后触发。
     * @param {(ev: AnimationEvent) => void} fn
     */
    DOMNodeInserted: fn =>
      void document.addEventListener(
        'DOMNodeInserted',
        ev => {
          // if (ev.animationName == 'nodeInserted') {
          fn(ev)
          // }
        },
        true
      )
  },
  XMLHttpRequest: {
    /**
     * 拦截 XMLHttpRequest。
     * @param {(fn: (method: string, url: string | URL) => void) => void} fn
     */
    open: fn => void fn(window.XMLHttpRequest.prototype.open)
  }
}
/**
 * 获得默认配置。
 * @returns 默认配置。
 */
function default_config() {
  return {
    disabled: [],
    option: {}
  }
}
let XesExt_config = default_config()
class PluginManager {
  /**
   * 获得名为 id 的设置，若找不到则以 value 顶替。
   * @param {id} id 设置 id。
   * @param {any} value 顶替的值。
   * @returns {any} 设置的值。
   */
  get_option_or(id, value) {
    if (XesExt_config.option[id] !== undefined) {
      return XesExt_config.option[id]
    }
    XesExt_config.option[id] = value
    window.localStorage.setItem('XesExt', JSON.stringify(XesExt_config))
    return value
  }
  /**
   * 重设 ID 为 id 的设置为指定值。
   * @param {string} id 设定 id。
   * @param {any} value 设定的值。
   */
  set_option(id, value) {
    XesExt_config.option[id] = value
    window.localStorage.setItem('XesExt', JSON.stringify(XesExt_config))
  }
  /**
   * 注册功能。
   * @param {string} id 功能的 ID。
   * @param {string} description 功能的人类可读描述。
   * @param {Function} patcher 补丁器。
   * @param {Function} fn 功能本体函数。
   */
  plug(id, description, patcher, fn) {
    this._events[id] = [description, patcher, fn]
  }
  /**
   * 完成注册，开始加载 XesExt。
   */
  done() {
    const v = XesExt_config.disabled
    if (!v instanceof Array) {
      logger.error('XesExt 加载失败。请检查配置文件是否设置正确。')
      return
    }
    for (const [key, value] of Object.entries(this._events)) {
      if (!v.includes(key)) {
        logger.warn(`XesExt 正在加载功能 %c${key}%c。`, CODEFONT_CSS, '')
        value[1](value[2])
      }
    }
  }
  constructor() {
    this._events = {}
  }
}
const plug = new PluginManager()
window.XesExt = {
  /**
   * 获得帮助。
   * @param {string | undefined} 帮助 ID。不填则查看全部。
   */
  help(obj = undefined) {
    if (obj == undefined) {
      logger.warn('XesExt v2 帮助')
      logger.warn(
        '警告: XesExt v2 和 XesExt 不兼容。在更新后，可能需要重新设置所有配置。'
      )
      logger.warn('所有条目:')
      logger.table({
        enable_plugin: '关于启用/关闭功能的方法',
        option: '关于设置',
        development: '关于如何开发功能'
      })
      logger.warn(
        '请输入 %clogger.warn("条目 ID")%c 来查看相应条目的帮助。',
        CODEFONT_CSS,
        ''
      )
    } else if (obj == 'enable_plugin') {
      logger.warn(
        '以下是 XesExt 对象中 %cenable/disable%c 方法参数的说明。',
        CODEFONT_CSS,
        ''
      )
      logger.table({
        id: '可选，需启用/禁用功能的 ID。若不指定，则会打印目前启用/禁用的全部功能。'
      })
    } else if (obj == 'option') {
      logger.warn('%cXesExt.option%c 可以获取/更改设置内容。', CODEFONT_CSS, '')
      logger.warn('以下是 XesExt 对象中 option 方法参数的说明。')
      logger.table({
        id: '可选，需设定的设置 id。不指定时，打印全部设置。',
        value: '可选，需设定的设置值。不指定时，返回这个 id 的设置。'
      })
    } else if (obj == 'development') {
      logger.warn('%cplug.plug%c 可以注册一个功能。', CODEFONT_CSS, '')
      logger.warn('以下是 plug 对象中 plug 方法参数的说明。')
      logger.table({
        id: '功能的 ID。',
        description: '功能的人类可读描述。',
        patcher:
          '补丁器。在本插件中预置有 2 个补丁器 "patch.document" 和 "patch.XMLHttpRequest"，用于给相应的方法/事件打上补丁。这些补丁器都需要一个函数作为参数，并且会将函数以一定的方式注册到某个事件上，或者直接调用。',
        fn: '功能本体函数。对于函数的补丁，第一个参数为原函数，可以用来作为覆盖函数时当作原函数调用。'
      })
    } else {
      logger.warn('无法找到条目。请确认您的拼写。')
    }
  },
  /**
   * 禁用功能。当没有参数时，查看已经禁用的功能列表。
   * @param {string[]} args 禁用的功能 ID。
   */
  disable(...args) {
    if (args.length == 0) {
      {
        const v = XesExt_config.disabled,
          v2 = {}
        if (!v instanceof Array) {
          logger.error('XesExt 加载失败。请检查配置文件是否设置正确。')
          return
        }
        if (v.length != 0) {
          logger.warn('已经禁用的功能:')
          for (const key of v) {
            v2[key] = plug._events[key][0]
          }
          logger.table(v2)
        } else {
          logger.warn('尚未禁用任何功能。')
        }
      }
      return
    }
    for (const id of args) {
      if (!XesExt_config.disabled.includes(id)) {
        XesExt_config.disabled.push(id)
      }
      window.localStorage.setItem('XesExt', JSON.stringify(XesExt_config))
      logger.warn(`XesExt 已经禁用了 %c${id}%c。`, CODEFONT_CSS, '')
    }
    logger.warn('将在 %c3s%c 后刷新网页以应用更改。', CODEFONT_CSS, '')
    setTimeout(() => window.location.reload(), 3000)
  },
  /**
   * 启用功能。
   * @param {string[]} args 启用的功能 ID。
   */
  enable(...args) {
    if (args.length == 0) {
      {
        const v = XesExt_config.disabled,
          v2 = {}
        if (!v instanceof Array) {
          logger.error('XesExt 加载失败。请检查配置文件是否设置正确。')
          return
        }
        if (v.length != Object.keys(plug._events).length) {
          logger.warn('已经启用的功能:')
          for (const [key, value] of Object.entries(plug._events)) {
            if (!v.includes(key)) {
              v2[key] = value[0]
            }
          }
          logger.table(v2)
        } else {
          logger.warn('尚未启用任何功能。')
        }
      }
      return
    }
    for (const id of args) {
      XesExt_config.disabled = XesExt_config.disabled.filter(val => val != id)
      window.localStorage.setItem('XesExt', JSON.stringify(XesExt_config))
      logger.warn(`XesExt 已经启用了 %c${id}%c。`, CODEFONT_CSS, '')
    }
    logger.warn('将在 %c3s%c 后刷新网页以应用更改。', CODEFONT_CSS, '')
    setTimeout(() => window.location.reload(), 3000)
  },
  /**
   * 获得 XesExt 设置。
   * @param {string | undefined} id 设置的 ID。
   * @param {string | undefined} value 设置的值。
   */
  option(...args) {
    if (args.length == 0) {
      logger.warn('XesExt 设置:')
      logger.table(XesExt_config.option)
      return
    }
    if (args.length == 1) {
      return XesExt_config.option[args[0]]
    }
    XesExt_config.option[args[0]] = args[1]
    window.localStorage.setItem('XesExt', JSON.stringify(XesExt_config))
    logger.warn(
      `XesExt 已经设置了 %c${args[0]}%c 为 %c${args[1]}%c。`,
      CODEFONT_CSS,
      '',
      CODEFONT_CSS,
      ''
    )
    logger.warn('将在 %c3s%c 后刷新网页以应用更改。', CODEFONT_CSS, '')
    setTimeout(() => window.location.reload(), 3000)
  }
}
;(() => {
  if (!window.location.hostname.includes('xueersi.com')) {
    logger.warn(`XesExt 将不在 ${window.location.href} 内运行。`)
    delete window.XesExt
    return
  }
  {
    logger.warn('XesExt 正在加载配置。')
    let v = window.localStorage.getItem('XesExt')
    if (v == null) {
      window.localStorage.setItem('XesExt', JSON.stringify(XesExt_config))
    } else {
      try {
        XesExt_config = JSON.parse(v)
      } catch (_) {
        window.localStorage.setItem('XesExt', JSON.stringify(XesExt_config))
      }
    }
  }
  plug.plug('adapt', '变更改编按钮行为。', patch.document.load, () => {
    const adaptButton = document.getElementsByClassName('adapt')
    if (adaptButton.length == 1) {
      adaptButton[0].replaceWith(adaptButton[0].cloneNode(true))
      adaptButton[0].childNodes[1].data = ' 审查 '
      adaptButton[0].addEventListener('click', ev => {
        window.open(getScratchlink.apply(null, getPropertyByUrl()), '_blank')
        ev.preventDefault()
      })
    } else {
      const notAllowAdaptButton = document.getElementsByClassName('tooltip')
      if (notAllowAdaptButton.length == 1) {
        notAllowAdaptButton[0].replaceWith(
          notAllowAdaptButton[0].cloneNode(true)
        )
        notAllowAdaptButton[0].childNodes[0].className = 'adapt'
        notAllowAdaptButton[0].childNodes[0].childNodes[0].className =
          'never-adapt'
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
        document
          .getElementsByClassName('adapt')[0]
          .addEventListener('click', ev => {
            window.open(
              getScratchlink.apply(null, getPropertyByUrl()),
              '_blank'
            )
            ev.preventDefault()
          })
      }
    }
  })
  plug.plug('remove_rule', '删除社区公约。', patch.document.load, () => {
    const rule = document.getElementsByClassName('rule')
    if (rule.length == 1) {
      rule[0].remove()
    }
  })
  plug.plug(
    'remove_template',
    '[编辑器模式] 删除模板按钮。',
    patch.document.load,
    () => {
      const btn = searchElem('a', ' 模板 ')
      if (btn.length == 1) {
        btn[0].remove()
      }
    }
  )
  plug.plug(
    'remove_textsize',
    '删除字体大小按钮。',
    patch.document.load,
    () => {
      const textsize = document.getElementsByClassName('btn-font-size')
      if (textsize.length == 1) {
        if (!window.location.pathname.startsWith('/ide/code/')) {
          textsize[0].remove()
        }
      }
    }
  )
  plug.plug('theme', '[编辑器模式] 更换主题。', patch.document.load, () => {
    // 更换字体大小按钮
    const textsize = document.getElementsByClassName('btn-font-size')
    if (textsize.length == 1) {
      if (
        window.aceEditor &&
        window.location.pathname.startsWith('/ide/code/')
      ) {
        for (const d of textsize[0].childNodes) {
          textsize[0].removeChild(d)
        }
        textsize[0].replaceWith(textsize[0].cloneNode(true))
        textsize[0].textContent = ' T '
        textsize[0].addEventListener('click', ev => {
          const t = prompt(
            `输入新的主题 ID(比如 ace/theme/tomorrow_night):`,
            window.aceEditor.getTheme()
          )
          if (t) {
            plug.set_option('theme', t)
            window.aceEditor.setTheme(t)
          }
          ev.preventDefault()
        })
      }
    }
    // 破解 aceEditor
    const editor = document.getElementsByClassName(
      'ace-editor tile is-child box ace_editor ace-tm'
    )
    if (editor.length == 1) {
      editor[0].attributes.removeNamedItem(editor[0].attributes[0].name)
      editor[0].className = 'ace-editor tile is-child ace_editor ace-tm'
    }
    const gutterLayer = document.getElementsByClassName(
      'ace_layer ace_gutter-layer'
    )
    if (gutterLayer.length == 1) {
      gutterLayer[0].style.textAlign = 'right'
      gutterLayer[0].className = gutterLayer[0].className.replace(
        'ace_gutter-layer',
        ''
      )
    }
    // 从 localStorage 读入
    if (window.aceEditor) {
      const g = plug.get_option_or('theme', 'ace/theme/tomorrow_night')
      window.aceEditor.setTheme(g)
    }
  })
  plug.plug('anti_autolike', '防止自动点赞。', patch.document.load, () => {
    const likebtn = document.querySelector('.like')
    if (likebtn) {
      likebtn.click = () => {
        logger.trace('XesExt 检测到点赞按钮被触发。此作品可能含有刷赞代码。')
      }
    }
    const favbtn = document.querySelector('.favorites')
    if (favbtn) {
      favbtn.click = () => {
        logger.trace('XesExt 检测到收藏按钮被触发。此作品可能含有刷赞代码。')
      }
    }
    const followbtn = document.querySelector('.focus-btn')
    if (followbtn) {
      followbtn.click = () => {
        logger.trace('XesExt 检测到关注按钮被触发。此作品可能含有刷赞代码。')
      }
    }
  })
  plug.plug('xterm', '启用 xterm.js v5 支持。', patch.document.start, () => {
    const project = getPropertyByUrl()
    if (project) {
      // 连字特性未启用 ('xterm-addon-ligatures.js') 原因:Lightpad
      // Woohoo, Keep me updated!
      ;[
        'https://cdn.jsdelivr.net/npm/xterm/lib/xterm.min.js',
        'https://cdn.jsdelivr.net/npm/xterm-addon-webgl/lib/xterm-addon-webgl.min.js',
        'https://cdn.jsdelivr.net/npm/xterm-addon-web-links/lib/xterm-addon-web-links.min.js',
        'https://cdn.jsdelivr.net/npm/xterm-addon-canvas/lib/xterm-addon-canvas.min.js',
        'https://cdn.jsdelivr.net/npm/xterm-addon-unicode11/lib/xterm-addon-unicode11.min.js',
        'https://cdn.jsdelivr.net/npm/xterm-addon-fit/lib/xterm-addon-fit.min.js',
        'https://cdn.jsdelivr.net/npm/xterm/css/xterm.css'
      ].forEach(e => {
        if (e.endsWith('.js')) {
          const script = document.createElement('script')
          script.src = e
          document.head.appendChild(script)
        } else {
          const css = document.createElement('link')
          css.href = e
          css.type = 'text/css'
          css.rel = 'stylesheet'
          document.head.appendChild(css)
        }
      })
      let newref = undefined
      Object.defineProperty(window, 'refWsTerm', {
        get() {
          if (newref == undefined || newref.xterm == undefined) {
            newref = {}
            let newterm = undefined
            Object.defineProperty(newref, 'xterm', {
              get() {
                return newterm
              },
              set(e) {
                newterm = e
                window.refWsTerm = window.refWsTerm
              }
            })
          }
          return newref
        },
        set(e) {
          const w = newref == undefined
          newref = e
          if (
            newref.xterm != undefined &&
            (w || !(newref.xterm.term instanceof window.Terminal))
          ) {
            const tmp = {}
            for (const [key, value] of Object.entries(
              newref.xterm.term._core._events
            )) {
              if (!tmp[key]) tmp[key] = []
              value.forEach(v => {
                tmp[key].push(v)
              })
            }
            newref.xterm.close()
            const xterm = document.getElementById('terminal')
            if (xterm) {
              // 背景修补
              xterm.style.backgroundColor =
                xterm.parentNode.style.backgroundColor = xterm_theme.background
              const term = new window.Terminal({
                rows: newref.xterm.term.rows,
                cols: newref.xterm.term.cols,
                fontSize: 15,
                fontFamily:
                  '"Jetbrains Mono", "Fira Code", "Cascadia Code", "Noto Emoji", "Segoe UI Emoji", "Lucida Console", Menlo, courier-new, courier, monospace',
                theme: xterm_theme,
                cursorBlink: true,
                allowProposedApi: true
              })
              term.open(xterm)
              // WebGL 加速
              try {
                // 检查是否支持 WebGL
                const canvas = document.createElement('canvas')
                const gl =
                  canvas.getContext('webgl') ||
                  canvas.getContext('experimental-webgl')
                if (gl instanceof WebGLRenderingContext) {
                  try {
                    term.loadAddon(new window.WebglAddon.WebglAddon())
                  } catch (_) {
                    term.loadAddon(new window.CanvasAddon.CanvasAddon())
                    logger.error(
                      'XesExt %cxterm%c 无法正常使用 %cWebGL%c 作为渲染器。这可能是一个内部错误，请收集信息发送给 %cxterm-js%c。',
                      CODEFONT_CSS,
                      '',
                      CODEFONT_CSS,
                      '',
                      CODEFONT_CSS,
                      ''
                    )
                  }
                } else {
                  logger.error(
                    'XesExt %cxterm%c 正在使用 %cCanvas%c 作为渲染器，因为你的浏览器不支持 %cWebGL%c 特性。Canvas 渲染器可能渲染和 %cWebGL%c 不一致，并且速度更低。',
                    CODEFONT_CSS,
                    '',
                    CODEFONT_CSS,
                    '',
                    CODEFONT_CSS,
                    '',
                    CODEFONT_CSS,
                    ''
                  )
                  term.loadAddon(new window.CanvasAddon.CanvasAddon())
                }
                // term.loadAddon(new window.LigaturesAddon.LigaturesAddon())
                term.loadAddon(new window.WebLinksAddon.WebLinksAddon())
                term.loadAddon(new window.Unicode11Addon.Unicode11Addon())
                const fit = new window.FitAddon.FitAddon()
                term.loadAddon(fit)
                term.fit = () => fit.fit()
                let _ev = {}
                term.on = (e, f) => {
                  // 为以前版本的兼容性作处理。
                  switch (e) {
                    case 'data': {
                      const l = term.onData(f)
                      if (_ev[e] == undefined) {
                        _ev[e] = [l]
                      } else {
                        _ev[e].push(l)
                      }
                      break
                    }
                    case 'resize': {
                      const l = term.onResize(f)
                      if (_ev[e] == undefined) {
                        _ev[e] = [l]
                      } else {
                        _ev[e].push(l)
                      }
                      break
                    }
                  }
                }
                term.off = () => {
                  // 为以前版本的兼容性作处理。
                  // if (_ev[e] != undefined) {
                  //     for (const v of _ev[e]) {
                  //         v.dispose()
                  //     }
                  //     _ev[e] = []
                  // }
                  // 可惜的是，学而思前端太蠢了忘记了重新注册事件，因此我们完全不做处理。
                }
                for (const [key, value] of Object.entries(tmp)) {
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
                logger.error(
                  `XesExt %cxterm%c 无法加载，因为无法加载功能。\n${e}`,
                  CODEFONT_CSS,
                  ''
                )
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
              // 修正居中问题
              xterm.childNodes[0].style.textAlign = 'left'
              newref.xterm.term = term
            }
          }
        }
      })
    }
  })
  plug.plug(
    'no_ads',
    '拦截全部跟踪器和广告。',
    patch.XMLHttpRequest.open,
    _open => {
      window.XMLHttpRequest.prototype.open = function (e, t, n) {
        if (t.includes('appid') && t.endsWith('.gif')) {
          _open.call(this, e, 'data:application/json,{}', n)
        } else if (t.startsWith('/api/pop/show/')) {
          _open.call(
            this,
            e,
            'data:application/json,{"stat":1,"status":1,"msg":"","data":{"id":-1,"type":"normal","ads":[],"force":0,"open":1}}',
            n
          )
        } else if (t.startsWith('/api/index/works/modules')) {
          _open.call(
            this,
            e,
            'data:application/json,{"stat":1,"status":1,"msg":"","data":[{"title":"可多推荐","simple_title":"可多推荐","lines":2,"items":[]},{"title":"我的关注","simple_title":"我的关注","lines":2,"items":[]},{"title":"猜你喜欢","simple_title":"猜你喜欢","lines":2,"items":[]}]}',
            n
          )
        } else if (t.startsWith('/api/compilers/danger_level')) {
          _open.call(
            this,
            e,
            'data:application/json,{"stat":1,"status":1,"msg":"","data":{"result":null}}'
          )
        } else {
          _open.call(this, e, t, n)
        }
      }
    }
  )
  plug.plug(
    'hidden_work',
    '允许访问已经被删除的作品。',
    patch.XMLHttpRequest.open,
    _open => {
      const project = getPropertyByUrl()
      window.XMLHttpRequest.prototype.open = function (e, t, n) {
        if (
          project &&
          t.startsWith(`/api/compilers/v2/${project[0]}`) &&
          !this.XesExt
        ) {
          // 最差的解决办法...有办法变成异步么？
          let tmp = new XMLHttpRequest()
          tmp.XesExt = true
          tmp.open(e, t, false)
          tmp.send()
          if (tmp.status != 200) {
            tmp = new XMLHttpRequest()
            tmp.XesExt = true
            tmp.open(
              e,
              `/api/community/v4/projects/detail?id=${project[0]}&lang=${project[2]}`,
              false
            )
            tmp.send()
          }
          const fixed = JSON.parse(tmp.response)
          if (!fixed.data.published) {
            fixed.data.published_at = fixed.data.modified_at
          }
          Object.defineProperties(this, {
            status: {
              get: () => tmp.status
            },
            response: {
              get: () => JSON.stringify(fixed)
            },
            statusText: {
              get: () => tmp.statusText
            },
            responseText: {
              get: () => JSON.stringify(fixed)
            }
          })
          _open.call(this, e, 'data:application/json,{}', n)
        } else _open.call(this, e, t, n)
      }
    }
  )
  plug.plug('clean_top', '还你一个干净的首页。', patch.document.start, () => {
    patch.document.DOMNodeInserted(() => {
      /// 删除猫博士的开眼课堂和老师们的作品[重制版] by 凌
      const keduo_wrapper = document.getElementById('homePageKeduoGuide')
      if (keduo_wrapper) {
        keduo_wrapper.remove()
        const cursorfollow = document.getElementById(
          'home-component-cursor-follow'
        )
        if (cursorfollow) {
          cursorfollow.childNodes[0].style.visibility = 'hidden'
          cursorfollow.childNodes[
            cursorfollow.childNodes.length - 1
          ].style.visibility = 'hidden'
        }
      }
      const tagwork = document.getElementsByClassName('tagWorks-list-wrapper')
      if (tagwork.length == 1) {
        tagwork[0].style.marginTop = '-311px'
      }
      const floorbarwrapper =
        document.getElementsByClassName('floor-bar-wrapper')
      if (floorbarwrapper.length == 1) {
        floorbarwrapper[0].remove()
      }
    })
    patch.XMLHttpRequest.open(_open => {
      window.XMLHttpRequest.prototype.open = function (e, t, n) {
        if (t.startsWith('/api/index/works/modules')) {
          _open.call(
            this,
            e,
            'data:application/json,{"stat":1,"status":1,"msg":"","data":[{"title":"可多推荐","simple_title":"可多推荐","lines":2,"items":[]},{"title":"我的关注","simple_title":"我的关注","lines":2,"items":[]},{"title":"猜你喜欢","simple_title":"猜你喜欢","lines":2,"items":[]}]}',
            n
          )
        } else {
          _open.call(this, e, t, n)
        }
      }
    })
  })
  plug.plug(
    'remove_timer',
    '删除作品运行间隔和 WebPy 运行时长限制。',
    patch.document.start,
    () => {
      const _setTimeout = window.setTimeout
      window.setTimeout = (code, delay, ...args) => {
        if (code.toString().includes('fnTryLockRun')) {
          code()
          return -1
        }
        return _setTimeout(code, delay, ...args)
      }
      if (window.Sk) {
        let v = Infinity
        Object.defineProperty(window.Sk, 'execLimit', {
          get: () => v,
          set: val => {
            if (val == 0) {
              v = 0
            } else {
              v = Infinity
            }
          }
        })
        Object.defineProperty(window.Sk, 'yieldLimit', {
          get: () => v,
          set: val => {
            if (val == 0) {
              v = 0
            } else {
              v = Infinity
            }
          }
        })
      }
    }
  )
  plug.plug('spam_filter', '过滤垃圾作品。', patch.document.start, () => {
    let spam_filter = plug.get_option_or('filter', '() => true')
    try {
      const url = new URL(spam_filter)
      spam_filter = () => true
      let req = new XMLHttpRequest()
      req.XesExt = true
      req.open('GET', url, false)
      req.send()
      try {
        spam_filter = new Function(`return ${req.responseText}`)()
        if (typeof spam_filter !== 'function')
          throw new Error('filter 必须为一个函数')
      } catch (err) {
        logger.error(
          `XesExt %cspam_filter%c 无法加载，因为配置文件读取错误。\n${err}`,
          CODEFONT_CSS,
          ''
        )
        return
      }
    } catch (_) {
      try {
        spam_filter = new Function(`return ${spam_filter}`)()
        if (typeof spam_filter !== 'function')
          throw new Error('filter 必须为一个函数')
      } catch (err) {
        logger.error(
          `XesExt %cspam_filter%c 无法加载，因为配置文件读取错误。\n${err}`,
          CODEFONT_CSS,
          ''
        )
        return
      }
    }
    patch.document.load(() => {
      const tooltip = document.getElementsByClassName('tag-tooltip')
      if (tooltip.length == 1) {
        tooltip[0].replaceWith(tooltip[0].cloneNode(true))
        tooltip[0].title = 'XesExt Spam Blocker'
        tooltip[0].addEventListener('click', ev => {
          const t = prompt(
            `请输入新的拦截器(留空重置为默认)，也可以输入 js URL 来持续订阅拦截器。\n\n提示:\n1. 拦截器的参数是 https://code.xueersi.com/api/works/latest 返回的 data 数组中的一个成员。\n2. 拦截器应返回 true(保留此作品) 或 false(过滤此作品)。\n3. 拦截器具有对网页的完全访问权限，请注意账户安全。`,
            plug.get_option_or('filter', '() => true')
          )
          if (t == '') {
            if (
              confirm(
                '确定要重置为默认拦截器吗？\n\n警告:\n1. 默认拦截器无法拦截任何内容。\n2. 原有的拦截器将永久丢失。'
              )
            ) {
              plug.set_option('filter', '() => true')
              window.location.reload()
            }
          }
          if (t) {
            try {
              const url = new URL(t)
              plug.set_option('filter', url.toString())
              window.location.reload()
            } catch (err) {
              let r = null
              try {
                r = new Function(`return ${t};`)()
                if (!r instanceof Function) {
                  throw null
                }
              } catch (_) {
                alert('拦截器语法不正确。')
                ev.preventDefault()
                return
              }
              plug.set_option('filter', r.toString())
              window.location.reload()
            }
          }
          ev.preventDefault()
        })
      }
    })
    patch.XMLHttpRequest.open(_open => {
      window.XMLHttpRequest.prototype.open = function (e, t, n) {
        if (
          (t.startsWith('/api/works/latest') ||
            t.startsWith('/api/works/popular') ||
            t.startsWith('/api/works/courses')) &&
          !this.XesExt
        ) {
          let tmp = new XMLHttpRequest()
          tmp.XesExt = true
          tmp.open(e, t, false)
          tmp.send()
          const fixed = JSON.parse(tmp.response)
          let c = []
          for (const v of fixed.data) {
            try {
              if (spam_filter(v)) c.push(v)
            } catch (err) {
              logger.error(
                `XesExt %cspam_filter%c 无法正确运行，因为拦截器发生错误。\n${err}`,
                CODEFONT_CSS,
                ''
              )
              c = fixed.data
              break
            }
          }
          if (c.length != fixed.data.length) {
            logger.warn(
              `XesExt %cspam_filter%c 在此页面上过滤了 ${
                fixed.data.length - c.length
              }(共 ${fixed.data.length}) 个作品。`,
              CODEFONT_CSS,
              ''
            )
          }
          fixed.data = c
          Object.defineProperties(this, {
            status: {
              get: () => tmp.status
            },
            response: {
              get: () => JSON.stringify(fixed)
            },
            statusText: {
              get: () => tmp.statusText
            },
            responseText: {
              get: () => JSON.stringify(fixed)
            }
          })
          _open.call(this, e, 'data:application/json,{}', n)
        } else _open.call(this, e, t, n)
      }
    })
  })
  plug.plug('unlimited_sign', '解除签名大小限制。', patch.document.load, () => {
    const sign = document.getElementById('signatureInput')
    if (sign) {
      sign.attributes.removeNamedItem('maxLength')
    }
    const comment = document.getElementById('comment-box')
    if (comment) {
      comment.attributes.removeNamedItem('maxLength')
    }
  })
  plug.plug(
    'disable_log',
    '禁止对 console 的调用。',
    patch.document.start,
    () => {
      console.log =
        console.warn =
        console.info =
        console.error =
        console.debug =
        console.time =
          () => {}
      window.onerror = () => {}
    }
  )
  plug.done()
  logger.clear()
  if (plug.get_option_or('first_time_use', true)) {
    alert(
      '提示:\nXesExt v2 和 XesExt 不兼容，且通过命令行修改设置。\nXesExt v1 的设置将不再有效，请重新设定相应设置。'
    )
    logger.warn(
      '这是你第一次使用 XesExt v2，请参照以下输出的说明，自行修改想要的配置。'
    )
    plug.set_option('first_time_use', false)
  }
  logger.warn('XesExt v2 是学而思最成熟、最优雅的扩展插件。')
  logger.warn(
    '关于开发自己的功能，可以参见 %cXesExt.help("development")%c。',
    CODEFONT_CSS,
    ''
  )
  window.XesExt.enable()
  logger.warn('请使用 %cXesExt.help()%c 查看帮助。', CODEFONT_CSS, '')
  logger.warn(
    '提示: 我们不推荐您用 XesExt 的代码二开项目，这破坏了 XesExt 兼容性，是受到谴责的。\n如果你想为社区插件做出贡献，你可以写一个功能并提交，请参照相关帮助页面。'
  )
})()
