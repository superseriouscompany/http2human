'use strict';

/**
 *
 * @param  {[type]} url    [description]
 * @param  {[type]} params [description]
 * @callback {Error} err
 *
 *
 * http2human wraps a `fetch` request and formats all errors in a standard way.
 *
 * Fields provided (only name is guaranteed):
 *
 * err.name         - ServerError, UserError, NetworkError, LowLevelError
 * err.suggestion   - (if available) suggestion from server as to resolution steps
 * err.responseBody - (if available) json response body object or plaintext response
 * err.statusCode   - (if available) http status code returned by server
 *
 */
// TODO: ClientNetworkError, ServerNetworkError
// TODO: TimeoutError
// TODO: http2human.retry(), http2human.cancel(), http2human.backoff()
// TODO: use whatwg-fetch
module.exports = function http2human(url, params) {
  let fetchPolyfill;
  if( typeof fetch === 'undefined' ) {
    fetchPolyfill = require('node-fetch');
  }

  return fetchPolyfill(url, params).then(function(response) {
    if( response.ok ) {
      let text;
      return response.text().then(function(text) {
        try {
          const body = JSON.parse(text);
          return body;
        } catch(err) {
          return text;
        }
      })
    }

    if( response.status >= 400 && response.status < 500 ) {
      return response.text().then(function(text) {
        let body = false;
        try {
          body = JSON.parse(text);
          text = body.message;
          if( body.error ) {
            text = typeof body.error === 'string' ?
              body.error :
              body.error.message || body.message;
          }
        } catch(err) {
          if( err.name == 'SyntaxError' ) { console.warn('Unable to parse json', text); }
        }

        const err = new Error(text);
        err.responseBody = body || {"rawText": text};
        err.statusCode = response.status;
        err.suggestion = text;
        err.name = 'UserError';
        throw err;
      }).catch(function(err) {
        if( err.name != 'UserError' ) err.name = 'LowLevelError';
        throw err;
      })
    }

    if( response.status >= 500 ) {
      return response.text().then(function(text) {
        let body = false;
        try {
          body = JSON.parse(text)
          text = body.message || (body.error && body.error.message);
        } catch(err) {
          if( err.name == 'SyntaxError' ) { console.warn('Unable to parse json', text); }
        }

        const err = new Error(text);
        err.responseBody = body || {"unparsed": text};
        err.statusCode = response.status;
        err.suggestion = text;
        err.name = 'ServerError';
        throw err;
      }).catch(function(err) {
        if( err.name != 'ServerError' ) err.name = 'LowLevelError';
        throw err;
      })
    }

    let err = new Error(`Unknown Status Code: ${response.status}`);
    err.name = 'LowLevelError';
    throw err;
  }).catch(function(err) {
    if( err.message == 'Network request failed' ) {
      err.name = 'NetworkError';
    }
    throw err;
  })
}
