import { exec, init } from './richeditor'

export default {
  create () {
    let contentEl = document.getElementById('html-output')
    const editor = init({
      element: document.getElementById('editor'),
      onChange: html => {
        contentEl.textContent = html
        dispatchEvent(document.querySelector('textarea[name=content]'), 'input')
      },
      defaultParagraphSeparator: 'p',
      styleWithCSS: true,
      actions: [
        'bold',
        'underline',
        'italic',
        'strikethrough',
      ],
      classes: {
        actionbar: 'pell-actionbar-custom-name',
        button: 'pell-button-custom-name',
        content: 'rich-textarea',
        selected: 'pell-button-selected-custom-name'
      }
    })

    // editor.content<HTMLElement>
    // To change the editor's content:
    editor.content.innerHTML = contentEl.textContent || '<p>作品正文...</p>'
  }
}

// public
function dispatchEvent(el, eventName) {
  let event = new Event(eventName, { bubbles: true });
  // hack React15
  event.simulated = true;
  // hack React16 内部定义了descriptor拦截value，此处重置状态
  let tracker = el._valueTracker;
  if (tracker) {
    tracker.setValue(lastValue);
  }
  el.dispatchEvent(event);
}
