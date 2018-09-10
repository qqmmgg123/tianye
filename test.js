let a = (() => {
  return async function test(c) {
    if (c) {
      return c
    } else {
      throw new Error('error')
    }
  }
})()
a(true).then((d) => {
  console.log('success', d)
}).catch(e => {
  console.log('error', e.message)
})