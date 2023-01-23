// ==UserScript==
// @name         XesExt
// @namespace    http://github.com/FurryR/XesExt
// @version      0.1.28
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
  brightWhite: '#FFFFFF',
}
let SPAM_FILTER = () => false
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
      'scratch',
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
      'cpp',
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
function lightinit() {
  /// 删除猫博士的开眼课堂和老师们的作品[重制版] by 凌
  const keduo_wrapper = document.getElementById('homePageKeduoGuide')
  if (keduo_wrapper) {
    console.warn('XesExt patched homePageKeduoGuide div')
    keduo_wrapper.remove()
    const tagwork = document.getElementsByClassName('tagWorks-list-wrapper')
    if (tagwork.length == 1) {
      tagwork[0].style.marginTop = '-311px'
    }
    console.warn('XesExt patched tagWorks-list-wrapper')
    const cursorfollow = document.getElementById('home-component-cursor-follow')
    if (cursorfollow) {
      cursorfollow.childNodes[0].style.visibility = 'hidden'
      cursorfollow.childNodes[
        cursorfollow.childNodes.length - 1
      ].style.visibility = 'hidden'
    }
  }
  const floorbarwrapper = document.getElementsByClassName('floor-bar-wrapper')
  if (floorbarwrapper.length == 1) {
    console.warn('XesExt patched floor-bar-wrapper div')
    floorbarwrapper[0].remove()
  }
}
;(function () {
  if (window.location.href.indexOf('xueersi.com') == -1) {
    console.warn(`XesExt prevented in ${window.loadtion.href}`)
    return
  }
  window.addEventListener('load', () => {
    console.warn('XesExt init')
    // [独占][Pro][Beta] XesExt Spam Blocker by 凌
    const tooltip = document.getElementsByClassName('tag-tooltip')
    if (tooltip.length == 1) {
      console.warn('XesExt patched tag-tooltip btn')
      tooltip[0].replaceWith(tooltip[0].cloneNode(true))
      tooltip[0].title = 'XesExt Spam Blocker'
      tooltip[0].addEventListener('click', (ev) => {
        const t = prompt(
          `输入新的拦截器(留空重置为默认):`,
          SPAM_FILTER.toString()
        )
        if (t == '') {
          if (confirm('你确定要重置为默认拦截器？\n原有的拦截器将丢失！')) {
            window.localStorage.setItem('__xesext_blocker', '')
            window.location.reload()
          }
        }
        if (t) {
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
          window.localStorage.setItem('__xesext_blocker', r.toString())
          window.location.reload()
        }
        ev.preventDefault()
      })
    }
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
          .addEventListener('click', (ev) => {
            window.open(
              getScratchlink.apply(null, getPropertyByUrl()),
              '_blank'
            )
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
      if (
        window.aceEditor &&
        window.location.pathname.startsWith('/ide/code/')
      ) {
        for (const d of textsize[0].childNodes) {
          textsize[0].removeChild(d)
        }
        textsize[0].replaceWith(textsize[0].cloneNode(true))
        textsize[0].textContent = ' T '
        textsize[0].addEventListener('click', (ev) => {
          const t = prompt(
            `输入新的主题 ID(比如 ace/theme/tomorrow_night):`,
            window.aceEditor.getTheme()
          )
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
    const editor = document.getElementsByClassName(
      'ace-editor tile is-child box ace_editor ace-tm'
    )
    if (editor.length == 1) {
      console.warn('XesExt patched editor div')
      editor[0].attributes.removeNamedItem(editor[0].attributes[0].name)
      editor[0].className = 'ace-editor tile is-child ace_editor ace-tm'
    }
    const gutterLayer = document.getElementsByClassName(
      'ace_layer ace_gutter-layer'
    )
    if (gutterLayer.length == 1) {
      console.warn('XesExt patched gutter-layer div')
      gutterLayer[0].style.textAlign = 'right'
      gutterLayer[0].className = gutterLayer[0].className.replace(
        'ace_gutter-layer',
        ''
      )
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
        window.localStorage.setItem(
          '__xesext_theme',
          'ace/theme/tomorrow_night'
        )
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
  /// [独占][Pro][Beta] XesExt Spam Blocker by 凌
  /// [独占][Pro] 访问已删除的作品 by 凌
  /// 去除危险提示 by 凌
  /// 删除猫博士的开眼课堂和老师们的作品[重制版] by 凌
  // 从 localStorage 读入过滤器
  // 社区贵物屏蔽器 第一版
  const default_blocker = (data) => {
    /** --check-for-default-updates **/
    return (
      data.name.includes('随堂') || // 过滤随堂测其一
      data.name.includes('脑洞大开') || // 过滤随堂测其二
      data.name.includes('模板') || // 过滤低质量模板
      data.name.includes('黑化') || // 过滤火化小学生
      data.name.includes('我的世界') || // 过滤我的世界小学生
      data.name.toLowerCase().includes('minecraft') || // 要玩你的Minecraft去minebbs玩
      data.name.toLowerCase().includes('mc') || // MC批会不会好好打字？
      data.name.includes('原神') || // 任何OP都将被绳之以法
      data.name.toLowerCase().includes('phigros') || // 臀批过滤
      data.name.toLowerCase().includes('pgr') || // 臀批会不会好好打字？
      data.name.includes('波兰球') || // 感觉不如福瑞其一
      data.name.includes('火柴人') || // 感觉不如福瑞其二
      data.name.includes('专跑') || // 只会照着模板改的贵物们其一
      data.name.includes('一直向上') || // 只会照着模板改的贵物们其二
      data.name.includes('跑酷') || // 玩腻了捏
      data.name.includes('新年快乐') || // 狠狠地引流
      data.name.includes('新春快乐') || // 这个也NG
      data.name.includes('植物大战僵尸') || // 过滤 PVZ 小鬼
      data.name.toLowerCase().includes('pvz') || // 爬
      data.name.toLowerCase().includes('undertale') || // 卧槽，疣体小鬼！
      data.name.toLowerCase().includes('ut') || // y疣体小鬼会不会好好打字？
      data.name.includes('太空杀') || // 给 among us 留了条生路
      data.name.includes('三体') || // 电工文库
      data.name.toLowerCase().includes('three body') || // 电工文库其二
      data.name.includes('音游') || // 要玩音游怎么不去音游交流群？
      data.name.includes('后室') || // 后室小鬼实体较多，注意避让
      data.name.includes('封面') || // 音容宛在 ，笑貌永存。
      data.name.toLowerCase().includes('dream') || // dream和猪神比赛打胶...
      data.name.toLowerCase().includes('technoblade') || // dream阴猪神，猪神快要输了
      data.name.toLowerCase().includes('猪神') || // 发送身份证号即可为猪神打call！！！111
      data.name.includes('俄国') || // 卧槽，俄苏啊！其一
      data.name.includes('德国') || // 卧槽，俄苏啊！其二
      data.name.includes('达瓦里氏') || // 卧槽，俄苏啊！其三
      data.name.includes('迷你') || // 过滤迷你世界小学生
      data.name.toLowerCase().includes('mn') || // MC卫兵会不会好好打字？
      data.name.includes('图形化编程') || // 过滤小朋友
      data.name.includes('五凌') || // 蹭热度
      data.name.includes('四会') || // 蹭热度
      data.name.includes('凌之联邦') || // 蹭热度
      data.name.includes('逆天') || // 中二贵物大杂烩
      data.name.toLowerCase().includes('hello world') || // 默认作品
      data.name.toLowerCase().includes('hello webpy') || // 默认作品其二
      data.name.toLowerCase().includes('Python基础') || // 默认作品其三
      data.name.includes('模拟器') || // 要模拟去自己站里模拟
      data.name.includes('超级马里奥') || // DMCA警告
      data.name.includes('主页') || // 网络灵堂？
      data.user_id == 78180318 || // 低创贵物大杂烩
      data.user_id == 2842899 || // 满门抄斩(死因：标题党/成果剽窃/音游小鬼)
      data.user_id == 32231990 || // 编程中级高手其一(死因：C++操作符重载怎么写？)
      data.user_id == 16944115 || // 编程中级高手其一(死因：自制编程语言)
      data.user_id == 4947453 || // 跳脚大神(死因：社区公会)
      data.user_id == 69325668 || // 编程中级高手其四(死因：代码质量极差，bug太多而在他人作品跳脚)
      data.user_id == 45751200 || // 快速的OP连跳
      data.user_id == 77695337 || // 社区过家家其一
      data.user_id == 73424254 || // 社区过家家其二
      data.user_id == 12907647 || // 编程中级高手正主(死因：质量低而无脑粉丝多，更倡导错误代码习惯，误导他人)
      data.user_id == 44673885
    ) // 编程中级高手 Extra(死因：跳脚/严重的技术断层)
  }
  // 以下是废案：
  // data.user_id != 17025146 // 编程中级高手其三(死因：git水平有待提高)
  // data.user_id != 13104104 // 红豆大神(死因：社区公会)
  const config = window.localStorage.getItem('__xesext_blocker')
  if (config) {
    if (
      config.includes('--check-for-default-updates') &&
      config != default_blocker.toString() &&
      confirm(
        '检测到您的默认屏蔽器和官方版本不同。\n是否需要更新到最新版本的屏蔽器？'
      )
    ) {
      console.warn('XesExt Switch blocker to [default]')
      SPAM_FILTER = default_blocker
      window.localStorage.setItem('__xesext_blocker', SPAM_FILTER.toString())
    } else {
      SPAM_FILTER = new Function(`return ${config}`)()
      console.warn('XesExt Switch blocker to', SPAM_FILTER)
    }
  } else {
    console.warn('XesExt Switch blocker to [default]')
    SPAM_FILTER = default_blocker
    window.localStorage.setItem('__xesext_blocker', SPAM_FILTER.toString())
  }
  console.warn('XesExt patched object XMLHttpRequest')
  const _open = window.XMLHttpRequest.prototype.open
  const project = getPropertyByUrl()
  const _base_open = function (e, t, n) {
    if (t.includes('dj.xesimg.com')) {
      console.warn('XesExt patched dj.xesimg.com XHR')
      _open.call(this, e, (this.__xes_url = 'data:application/json,{}'), n)
    } else if (t.startsWith('/api/pop/show/')) {
      console.warn('XesExt patched /api/pop/show XHR')
      _open.call(
        this,
        e,
        (this.__xes_url =
          'data:application/json,{"stat":1,"status":1,"msg":"","data":{"id":-1,"type":"normal","ads":[],"force":0,"open":1}}'),
        n
      )
    } else if (t.startsWith('/api/index/works/modules')) {
      console.warn('XesExt patched /api/index/works/modules XHR')
      _open.call(
        this,
        e,
        (this.__xes_url =
          'data:application/json,{"stat":1,"status":1,"msg":"","data":[{"title":"可多推荐","simple_title":"可多推荐","lines":2,"items":[]},{"title":"我的关注","simple_title":"我的关注","lines":2,"items":[]},{"title":"猜你喜欢","simple_title":"猜你喜欢","lines":2,"items":[]}]}'),
        n
      )
    } else if (t.startsWith('/api/compilers/danger_level')) {
      console.warn('XesExt patched /api/compilers/danger_level XHR')
      _open.call(
        this,
        e,
        (this.__xes_url =
          'data:application/json,{"stat":1,"status":1,"msg":"","data":{"result":null}}')
      )
    } else {
      _open.call(this, e, t, n)
    }
  }
  if (project) {
    console.warn('XesExt is running in project page')
    /// [独占][Pro] 升级 xterm by 凌
    // 连字特性未启用 ('xterm-addon-ligatures.js') 原因:Lightpad
    // Woohoo, Keep me updated!
    ;[
      'https://cdn.jsdelivr.net/npm/xterm/lib/xterm.min.js',
      'https://cdn.jsdelivr.net/npm/xterm-addon-webgl/lib/xterm-addon-webgl.min.js',
      'https://cdn.jsdelivr.net/npm/xterm-addon-web-links/lib/xterm-addon-web-links.min.js',
      'https://cdn.jsdelivr.net/npm/xterm-addon-canvas/lib/xterm-addon-canvas.min.js',
      'https://cdn.jsdelivr.net/npm/xterm-addon-unicode11/lib/xterm-addon-unicode11.min.js',
      'https://cdn.jsdelivr.net/npm/xterm-addon-fit/lib/xterm-addon-fit.min.js',
      'https://cdn.jsdelivr.net/npm/xterm/css/xterm.css',
    ].forEach((e) => {
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
            },
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
            value.forEach((v) => {
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
              allowProposedApi: true,
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
                  console.error(
                    '[XesExt-xterm] Failed to initalize WebGL renderer. Switching to Canvas renderer.'
                  )
                }
              } else {
                console.error(
                  '[XesExt-xterm] Your browser does not support WebGL feature. Switching to Canvas renderer.'
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
              term.off = (e) => {
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
                  value.forEach((v) => {
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
            xterm.childNodes[0].addEventListener('wheel', (e) => {
              // if (term.buffer.active.baseY > 0) {
              e.preventDefault()
              // }
            })
            xterm.addEventListener('wheel', (e) => {
              e.preventDefault()
            })
            // 修正居中问题
            xterm.childNodes[0].style.textAlign = 'left'
            newref.xterm.term = term
          }
        }
      },
    })
    console.warn('XesExt patched window.refWsTerm')
    window.XMLHttpRequest.prototype.open = function (e, t, n) {
      this.__xes_url = t
      if (
        t.startsWith(`/api/compilers/v2/${project[0]}`) &&
        !this.__xes_disableFilter
      ) {
        console.warn(`XesExt replaced /api/compilers/v2/${project[0]} request`)
        // 最差的解决办法...有办法变成异步么？
        let tmp = new XMLHttpRequest()
        tmp.__xes_disableFilter = true
        tmp.open(e, t, false)
        tmp.send()
        if (tmp.status != 200) {
          tmp = new XMLHttpRequest()
          tmp.__xes_disableFilter = true
          tmp.open(
            e,
            (this.__xes_url = `/api/community/v4/projects/detail?id=${project[0]}&lang=${project[2]}`),
            false
          )
          tmp.send()
        }
        const fixed = JSON.parse(tmp.response)
        if (!fixed.data.published) {
          fixed.data.published_at = fixed.data.modified_at
        }
        Object.defineProperty(this, 'status', {
          get: () => tmp.status,
        })
        Object.defineProperty(this, 'response', {
          get: () => JSON.stringify(fixed),
        })
        Object.defineProperty(this, 'statusText', {
          get: () => tmp.statusText,
        })
        Object.defineProperty(this, 'responseText', {
          get: () => JSON.stringify(fixed),
        })
        _open.call(this, e, (this.__xes_url = 'data:application/json,{}'), n)
      } else _base_open.call(this, e, t, n)
    }
  } else {
    console.warn('XesExt is running in non-project page')
    window.XMLHttpRequest.prototype.open = function (e, t, n) {
      this.__xes_url = t
      if (
        (t.startsWith('/api/works/latest') ||
          t.startsWith('/api/works/popular') ||
          t.startsWith('/api/works/courses')) &&
        !this.__xes_disableFilter
      ) {
        console.warn(`XesExt replaced ${t} request`)
        let tmp = new XMLHttpRequest()
        tmp.__xes_disableFilter = true
        tmp.open(e, t, false)
        tmp.send()
        const fixed = JSON.parse(tmp.response)
        const c = []
        for (const v of fixed.data) {
          try {
            if (!SPAM_FILTER(v)) c.push(v)
            else console.error('XesExt filtered work', v)
          } catch (e) {
            console.error(e)
          }
        }
        fixed.data = c
        Object.defineProperty(this, 'status', {
          get: () => tmp.status,
        })
        Object.defineProperty(this, 'response', {
          get: () => JSON.stringify(fixed),
        })
        Object.defineProperty(this, 'statusText', {
          get: () => tmp.statusText,
        })
        Object.defineProperty(this, 'responseText', {
          get: () => JSON.stringify(fixed),
        })
        _open.call(this, e, (this.__xes_url = 'data:application/json,{}'), n)
      } else _base_open.call(this, e, t, n)
    }
  }
  // 6，非得让你污染原型链不可。学而思前端还是趁早辞职吧？
  console.warn('XesExt patched window.XMLHttpRequest.prototype.open')
  /// 删除作品运行间隔 by 凌
  const _setTimeout = window.setTimeout
  window.setTimeout = (code, delay, ...args) => {
    if (code.toString().includes('fnTryLockRun')) {
      code()
      return -1
    }
    return _setTimeout(code, delay, ...args)
  }
  console.warn('XesExt patched window.setTimeout')
})()
