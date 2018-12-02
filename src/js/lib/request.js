export function get(api, data) {
  let queryStr = Object.keys(data || {})
  .map(key => key + '=' + data[key])
  .join('&');
  return request([api, queryStr].join('?'), 'GET')
}

export function post(api, data) {
  return request(api, 'POST', data)
}

export function put(api, data) {
  return request(api, 'PUT', data)
}

export function del(api, data) {
  return request(api, 'DELETE', data)
}

function request(api, method, data, headers = {}) {
  /*return fetch(api, {
    method, // *GET, POST, PUT, DELETE, etc.
    mode: "cors", // no-cors, cors, *same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    headers: Object.assign({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }, headers),
    credentials: "same-origin",
    redirect: "follow", // manual, *follow, error
    referrer: "no-referrer", // no-referrer, *client
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  }).then(function(response) {
    return response.json()
  }).then(function(res) {
    if (!res.success) {
      switch (res.code) {
        case 1002:
          window.location.href = '/login'
          break
      }
    }
    return res
  })*/
  return axios({
    method,
    url: api,
    data,
    headers: Object.assign({
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }, headers),
  }).then(function(res) {
    return res.data
  }).catch(function(err) {
    switch (err.response.status) {
      case 401:
        window.location.href = '/login'
        break
    }
  })
}