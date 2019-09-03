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