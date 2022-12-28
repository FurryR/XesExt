// ==UserScript==
// @name         XesExt
// @namespace    http://github.com/FurryR/XesExt
// @version      0.1.12
// @description  Much Better than Original - 学而思功能增强
// @license      GPL-3.0
// @author       凌
// @run-at       document-start
// @match        https://code.xueersi.com/*
// @icon         https://code.xueersi.com/static/images/code-home/qrlogo.png
// @grant        none
// ==/UserScript==
/*
Copyright(c) 2021 FurryR
此程序基于 GPL-3.0 开源。
*/
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
  /// 删除猫博士的开眼课堂和老师们的作品 by 凌
  const filter1 = searchElem('span', '猫博士的开眼课堂')
  const filter2 = searchElem('span', '老师们的作品')
  if (filter1.length == 1) {
    console.warn('XesExt captured recommended-list span1')
    filter1[0].parentNode.parentNode.parentNode.remove()
  }
  if (filter2.length == 1) {
    console.warn('XesExt captured recommended-list span2')
    filter2[0].parentNode.parentNode.parentNode.remove()
  }
}
(function () {
  'use strict'
  window.addEventListener('load', () => {
    console.warn('XesExt init')
    /// 变更改编按钮行为 by 凌
    const adaptButton = document.getElementsByClassName('adapt')
    if (adaptButton.length == 1) {
      console.warn('XesExt captured adapt button')
      adaptButton[0].replaceWith(adaptButton[0].cloneNode(true))
      adaptButton[0].childNodes[1].data = ' 审查 '
      adaptButton[0].addEventListener('click', (ev) => {
        window.open(getScratchlink.apply(null, getPropertyByUrl()), '_blank')
        ev.preventDefault()
      })
    } else {
      const notAllowAdaptButton = document.getElementsByClassName('tooltip')
      if (notAllowAdaptButton.length == 1) {
        console.warn('XesExt captured disabled adapt button')
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
      console.warn('XesExt captured rule button')
      rule[0].remove()
    }
    /// [编辑器模式] 去除模板按钮 by 凌
    const btn = searchElem('a', ' 模板 ')
    if (btn.length == 1) {
      console.warn('XesExt captured template btn')
      btn[0].remove()
    }
    /// [编辑器模式] 去除编程百科按钮 by 凌
    const wiki = searchElem('a', ' 编程百科 ')
    if (wiki.length == 1) {
      console.warn('XesExt captured wiki btn')
      wiki[0].remove()
    }
    /// 删除或替换字体大小按钮 by 凌
    /// 注：在编辑器模式下，字体大小按钮将被替换为主题按钮。
    const textsize = document.getElementsByClassName('btn-font-size')
    if (textsize.length == 1) {
      console.warn('XesExt captured textsize div')
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
      console.warn('XesExt captured editor div')
      editor[0].attributes.removeNamedItem(editor[0].attributes[0].name)
      editor[0].className = 'ace-editor tile is-child ace_editor ace-tm'
    }
    const gutterLayer = document.getElementsByClassName('ace_layer ace_gutter-layer')
    if (gutterLayer.length == 1) {
      console.warn('XesExt captured gutter-layer div')
      gutterLayer[0].className = gutterLayer[0].className.replace('ace_gutter-layer', '')
    }
    // 从 localStorage 读入
    if (window.aceEditor) {
      console.warn('XesExt captured ace editor')
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
      console.log('XesExt captured like btn')
      likebtn.click = () => {
        console.error('XesExt 检测到点赞按钮被触发。此作品可能含有刷赞代码。')
      }
    }
    const favbtn = document.querySelector('.favorites')
    if (favbtn) {
      console.log('XesExt captured favorite btn')
      favbtn.click = () => {
        console.error('XesExt 检测到收藏按钮被触发。此作品可能含有刷赞代码。')
      }
    }
    const followbtn = document.querySelector('.focus-btn')
    if (followbtn) {
      console.log('XesExt captured follow btn')
      followbtn.click = () => {
        console.error('XesExt 检测到关注按钮被触发。此作品可能含有刷赞代码。')
      }
    }
    /// 更好的反跟踪 by 凌
    if (window.logger) {
      console.warn('XesExt captured object logger')
      for (const v in window.logger) {
        window.logger[v] = () => {}
      }
    }
    if (window.__XES_LOG__) {
      console.warn('XesExt captured object __XES_LOG__')
      for (const v in window.__XES_LOG__) {
        window.__XES_LOG__[v] = () => {}
      }
    }
    if (window.XesInstance) {
      console.warn('XesExt captured object XesInstance')
      for (const v in window.XesInstance) {
        window.XesInstance[v] = () => {}
      }
    }
    if (window.Xes) {
      console.warn('XesExt captured object Xes')
      for (const v in window.Xes) {
        window.Xes[v] = () => {}
      }
    }
    if (window.XesLoggerSDK) {
      console.warn('XesExt captured fn window.XesLoggerSDK')
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
  console.warn('XesExt captured object XMLHttpRequest')
  const _open = window.XMLHttpRequest.prototype.open
  const project = getPropertyByUrl()
  if (project) {
    window.XMLHttpRequest.prototype.open = function (e, t, n) {
      this.__xes_url = t
      if (t.startsWith(`/api/compilers/v2/${project[0]}`)) {
        console.warn(`XesExt replaced /api/compilers/v2/${project[0]} request`)
        this.__xes_url = `/api/community/v4/projects/detail?id=${project[0]}&lang=${project[2]}`
        _open.call(this, e, this.__xes_url, n)
      } else {
        _open.call(this, e, t, n)
      }
    }
  } else {
    window.XMLHttpRequest.prototype.open = function (e, t, n) {
      this.__xes_url = t
      if (t.startsWith('/api/pop/show/')) {
        console.warn('XesExt captured /api/pop/show XHR')
        _open.call(this, e, this.__xes_url = 'data:application/json,{"stat":1,"status":1,"msg":"","data":{"id":-1,"type":"normal","ads":[],"force":0,"open":1}}', n)
      } else {
        _open.call(this, e, t, n)
      }
    }
  }
  const _send = window.XMLHttpRequest.prototype.send
  window.XMLHttpRequest.prototype.send = function (body) {
    if (this.__xes_url.includes('dj.xesimg.com')) {
      console.warn('XesExt captured dj.xesimg.com XHR')
    } else _send.call(this, body)
  }
  // 社区主题美化 by 小埋 (凌 modified)
  console.warn('XesExt add style')
  const style = document.createElement('style');
  style.innerHTML = `
.floor-bar-wrapper { display: none }
.header {
  backdrop-filter:blur(5px);
}
.header.is-homepage {
  background-color:rgba(255,255,255,0.3)!important ;
}
.header-left-nav-item-active {
  background-color:rgba(0,0,0,0.08)!important;
}
.title-icon { display: none }
.hero {
  background: linear-gradient(to bottom, #92bcff, #66e6ffc4,#fff0) !important;
}
.header {
  background: #92bcff !important;
}
.user-introduction {
  background: linear-gradient(to bottom, #92bcff, #66e6ffc4) !important;
}
.user-name {
  color:#000000a8;
}
.signature-zone {
  color:#0000008f;
}
.user-count {
  color:#0000008f;
}
.headercon {
  background: linear-gradient(to left, #92bcffab, #66e6ff8f) !important;
}
.editor-group-header{
  background: #fafafa !important;
}
.headercon-logo {
  display: none;
}
.headercon-input {
  background-color: rgba(255,255,255,0.2) !important;
}
.headercon-right__btn {
  background: rgba(255,255,255,0.2) !important;
}
.headercon-center {
  margin: 0 !important;
}
`;
  document.head.appendChild(style);
})()
