import { striptags } from '@/js/lib/striptags'
const defaultParagraphSeparatorString = 'defaultParagraphSeparator'
const formatBlock = 'formatBlock'
const addEventListener = (parent, type, listener) => parent.addEventListener(type, listener)
const appendChild = (parent, child) => parent.appendChild(child)
const createElement = tag => document.createElement(tag)
const queryCommandState = command => document.queryCommandState(command)
const queryCommandValue = command => document.queryCommandValue(command)

export const exec = (command, value = null) => document.execCommand(command, false, value)

const defaultActions = {
  bold: {
    icon: '<b>B</b>',
    title: 'Bold',
    state: () => queryCommandState('bold'),
    result: () => exec('bold')
  },
  italic: {
    icon: '<i>I</i>',
    title: 'Italic',
    state: () => queryCommandState('italic'),
    result: () => exec('italic')
  },
  underline: {
    icon: '<u>U</u>',
    title: 'Underline',
    state: () => queryCommandState('underline'),
    result: () => exec('underline')
  },
  strikethrough: {
    icon: '<strike>S</strike>',
    title: 'Strike-through',
    state: () => queryCommandState('strikeThrough'),
    result: () => exec('strikeThrough')
  },
  center: {
    icon: '<strike> - </strike>',
    title: 'justifyCenter',
    state: () => queryCommandState('justifyCenter'),
    result: () => exec('justifyCenter')
  },
  heading1: {
    icon: '<b>H<sub>1</sub></b>',
    title: 'Heading 1',
    result: () => exec(formatBlock, '<h1>')
  },
  heading2: {
    icon: '<b>H<sub>2</sub></b>',
    title: 'Heading 2',
    result: () => exec(formatBlock, '<h2>')
  },
  paragraph: {
    icon: '&#182;',
    title: 'Paragraph',
    result: () => exec(formatBlock, '<p>')
  },
  quote: {
    icon: '&#8220; &#8221;',
    title: 'Quote',
    result: () => exec(formatBlock, '<blockquote>')
  },
  olist: {
    icon: '&#35;',
    title: 'Ordered List',
    result: () => exec('insertOrderedList')
  },
  ulist: {
    icon: '&#8226;',
    title: 'Unordered List',
    result: () => exec('insertUnorderedList')
  },
  code: {
    icon: '&lt;/&gt;',
    title: 'Code',
    result: () => exec(formatBlock, '<pre>')
  },
  line: {
    icon: '&#8213;',
    title: 'Horizontal Line',
    result: () => exec('insertHorizontalRule')
  },
  link: {
    icon: '&#128279;',
    title: 'Link',
    result: () => {
      const url = window.prompt('Enter the link URL')
      if (url) exec('createLink', url)
    }
  },
  image: {
    icon: '&#128247;',
    title: 'Image',
    result: () => {
      const url = window.prompt('Enter the image URL')
      if (url) exec('insertImage', url)
    }
  }
}

const defaultClasses = {
  actionbar: 'pell-actionbar',
  button: 'pell-button',
  content: 'pell-content',
  selected: 'pell-button-selected'
}

export const init = settings => {
  const actions = settings.actions
    ? (
      settings.actions.map(action => {
        if (typeof action === 'string') return defaultActions[action]
        else if (defaultActions[action.name]) return { ...defaultActions[action.name], ...action }
        return action
      })
    )
    : Object.keys(defaultActions).map(action => defaultActions[action])

  const classes = { ...defaultClasses, ...settings.classes }

  const defaultParagraphSeparator = settings[defaultParagraphSeparatorString] || 'div'

  const actionbar = createElement('div')
  actionbar.className = classes.actionbar
  actionbar.style.display = 'none'
  appendChild(settings.element, actionbar)

  const editor = createElement('div')
  editor.style.position = 'relative'
  appendChild(settings.element, editor)

  const content = settings.element.content = createElement('div')
  const placeholder = createElement('span')
  const covertText = (text) => text.replace(/([^\n]+)\n/g, '<p>$1</p>')
  .replace(/\n/g, '<p><br></p>')
  .replace(/\s/g, '&nbsp;')
  const togglePlaceholder = () => {
     placeholder.style.display = content.innerHTML ? 'none' : ''
  }
  content.contentEditable = true
  content.className = classes.content
  const initialHtml = settings.initialHtml || ''
  content.innerHTML = initialHtml !== striptags(initialHtml) 
  ? initialHtml
  : covertText(initialHtml)
  togglePlaceholder()
  settings.onChange(content.innerHTML)
  content.oninput = async (event) => {
    let res = await settings.onPreInput(content.innerHTML)
    if (res.needAsk) content.innerHTML = res.html
    let { firstChild } = event.target
    if (firstChild && firstChild.nodeType === 3) exec(formatBlock, `<${defaultParagraphSeparator}>`)
    else if (content.innerHTML === '<br>') content.innerHTML = ''
    togglePlaceholder()
    settings.onChange(content.innerHTML)
  }
  content.onpaste = (event) => {
    // cancel paste
    event.preventDefault();
    event = (event.originalEvent || event)
    let text = ''
    if (/text\/html/.test(event.clipboardData.types)) {
      let html = event.clipboardData.getData('text/html')
      // text = striptags(html, ['div', 'p', 'h1', 'h2', 'ol', 'ul', 'li'])
      text = html
    } else if (/text\/plain/.test(event.clipboardData.types)) {
      text = covertText(event.clipboardData.getData('text/plain'))
    }
    // insert text manually
    exec('insertHTML', text)
  }
  content.onkeydown = event => {
    if (event.key === 'Enter' && queryCommandValue(formatBlock) === 'blockquote') {
      setTimeout(() => exec(formatBlock, `<${defaultParagraphSeparator}>`), 0)
    }
  }
  // placeholder
  placeholder.innerHTML = settings.placeholder
  placeholder.style.position = 'absolute'
  placeholder.style.top = '11px'
  placeholder.style.left = '11px'
  placeholder.style.color = '#999999'
  placeholder.onmousedown = (event) => {
    event.preventDefault()
    content.focus()
  }
  appendChild(editor, content)
  appendChild(editor, placeholder)

  actions.forEach(action => {
    const button = createElement('button')
    button.className = classes.button
    button.innerHTML = action.icon
    button.title = action.title
    button.setAttribute('type', 'button')
    button.onclick = () => action.result() && content.focus()

    if (action.state) {
      const handler = () => button.classList[action.state() ? 'add' : 'remove'](classes.selected)
      addEventListener(content, 'keyup', handler)
      addEventListener(content, 'mouseup', handler)
      addEventListener(button, 'click', handler)
    }

    appendChild(actionbar, button)
  })

  if (settings.styleWithCSS) exec('styleWithCSS')
  exec(defaultParagraphSeparatorString, defaultParagraphSeparator)

  return {
    actionbarShow: false,
    showActionBar() {
      if (this.actionbarShow) return
      actionbar.style.display = ''
      this.actionbarShow = true
    },
    hideActionBar() {
      if (!this.actionbarShow) return
      actionbar.style.display = 'none'
      this.actionbarShow = false
    }
  }
}

export default { exec, init }
