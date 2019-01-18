import { exec, init } from './richeditor'

export default {
  create () {
    let contentEl = document.getElementById('html-output')
    const editor = init({
      element: document.getElementById('editor'),
      onChange: html => {
        contentEl.textContent = html
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
    editor.content.innerHTML = contentEl.textContent || '<p>内容...</p>'
  }
}
