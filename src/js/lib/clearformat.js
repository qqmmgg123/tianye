import { striptags } from './striptags'

const clearFormat = function(html) { 
  return html 
    ? striptags(html).replace(/^[(\&nbsp\;)\s\uFEFF\xA0]+|[(\&nbsp\;)\s\uFEFF\xA0]+$/g, '') 
        .replace(/&nbsp;/g, ' ')
    : ''
}

export { clearFormat }
