import { exec, init } from 'pell'

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
        {
          name: 'italic',
          result: () => exec('italic')
        },
        {
          name: 'backColor',
          icon: '<div style="background-color:pink;">A</div>',
          title: 'Highlight Color',
          result: () => exec('backColor', 'pink')
        },
        {
          name: 'image',
          result: () => {
            const url = window.prompt('Enter the image URL')
            if (url) exec('insertImage', url)
          }
        },
        {
          name: 'link',
          result: () => {
            const url = window.prompt('Enter the link URL')
            if (url) exec('createLink', url)
          }
        }
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
    editor.content.innerHTML = contentEl.textContent || '<b><u><i>内容...</i></u></b>'
  }
}
