import { exec, init } from './richeditor'

export default {
  create ({ bindEl, outputEl, onPreInput }) {
    const editor = init({
      element: bindEl,
      onPreInput,
      onChange: (html) => {
        outputEl.textContent = html
        dispatchEvent(document.querySelector('textarea[name=content]'), 'input')
      },
      defaultParagraphSeparator: 'p',
      placeholder: outputEl.placeholder,
      initialHtml: outputEl.value,
      styleWithCSS: true,
      actions: [
        'bold',
        'underline',
        'italic',
        'strikethrough',
        'center',
        'heading1',
        'heading2',
        'olist',
        'ulist',
        'quote',
        'image',
      ],
      classes: {
        actionbar: 'action-bar',
        button: 'action-button',
        content: 'rich-textarea',
        selected: 'action-button-selected'
      }
    })
    return editor
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
