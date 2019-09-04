// public method
export function dispatchEvent(el, eventName) {
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

export function delegate(el, selectors, handles) {
  el.addEventListener('click', function(e) {
    e = window.event || e
    let target = e.srcElement || e.target
  
    while (target && target !== e.currentTarget) {
      for (let i = 0, l = selectors.length; i < l; i++) {
        let selector = selectors[i]
        , handle = handles[i]
        if (target.matches(selector)) {
          return handle(e, target)
        }
      }
      target = target.parentNode
    }
  })
}

export function stringToByteSize(str) {
  let result, unit
  , map = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024
  }

  if (!str) {
    return null
  }
  result = /(\d+(?:\.\d+)?)?(B|KB|MB|GB|TB)/i.exec(str)

  if (!result || result.length < 1) {
    return null
  }

  unit = result[2] ? result[2].toUpperCase() : 'B'
  return Math.ceil(parseFloat(result[1]) * map[unit])
}

export function hasClass(obj, cls) {
  return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}

export function addClass(obj, cls) {
  if (!hasClass(obj, cls)) obj.className += " " + cls;
}

export function removeClass(obj, cls) {
  if (hasClass(obj, cls)) {
      var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
      obj.className = obj.className.replace(reg, ' ');
  }
}
