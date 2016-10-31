'use strict';

/**
 *
 * @param  {String} url    absolute url to pass along to fetch
 * @param  {Object} params optional params object to pass along to fetch
 * @param  {Number} ttl    optional ttl to reject request with TimeoutError
 * @callback {Error} err
 *
 * http2human wraps a `fetch` request and formats all errors in a standard way.
 *
 * Fields provided (only name is guaranteed):
 *
 * err.name         - ServerError, UserError, NetworkError, TimeoutError, LowLevelError
 * err.suggestion   - (if available) suggestion from server as to resolution steps
 * err.responseBody - (if available) json response body object or plaintext response
 * err.statusCode   - (if available) http status code returned by server
 *
 */
module.exports = function http2human(url, params, ttl) {
  let fetchPolyfill;
  if( typeof fetch === 'undefined' ) {
    fetchPolyfill = require('node-fetch');
  }

  return new Promise(function(resolve, reject) {
    let timeout, cancelled;
    if( ttl ) {
      timeout = setTimeout(function() {
        cancelled = true;
        let err = new Error(`Timed out in ${ttl} seconds`);
        err.name = 'TimeoutError';
        return reject(err);
      }, ttl);
    }

    fetchPolyfill(url, params).then(function(response) {
      if( cancelled ) { return; }
      timeout && clearTimeout(timeout);

      if( response.ok ) {
        return response.text().then(function(text) {
          try {
            const body = JSON.parse(text);
            return resolve(body);
          } catch(err) {
            return resolve(text);
          }
        })
      }

      if( response.status >= 400 && response.status < 500 ) {
        return response.text().then(function(text) {
          let err = decorateError(text, response);
          err.name = 'UserError';
          throw err;
        }).catch(function(err) {
          if( err.name != 'UserError' ) err.name = 'LowLevelError';
          throw err;
        })
      }

      if( response.status >= 500 ) {
        return response.text().then(function(text) {
          let err = decorateError(text, response);
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
      if( cancelled ) { return; }
      timeout && clearTimeout(timeout);

      // TODO: ClientNetworkError, ServerNetworkError
      if( err.message == 'Network request failed' ) {
        err.name = 'NetworkError';
      }
      reject(err);
    })
  })
}

function decorateError(responseText, response) {
  let text = responseText, body;
  try {
    body = JSON.parse(text)
    text = body.message;
    if( body.error ) {
      text = typeof body.error === 'string' ?
        body.error :
        body.error.message || body.message;
    }
  } catch(err) {
    if( err.name == 'SyntaxError' ) { console.warn('Unable to parse json', text); }
  }

  let err = new Error(text);
  err.responseBody = body || {"rawText": text};
  err.statusCode = response.status;
  err.suggestion = text;
  return err;
}
