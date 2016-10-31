# http2human

http2human tries to translate http errors for human use. It wraps `fetch` promises and returns standardized errors.

When a request to your server from a device actually succeeds, it's nothing short of a small miracle.
When it doesn't, a generic error message is dehumanizing to the person attempting to use your service.

Minimal example:

```javascript
http2human('https://google.com').then(function(body) {
  // do something with your successful response.
  // `body` will be an object if it's JSON parsable,
  // otherwise it'll be a string
}).catch(function(err) {
  alert(err.suggestion);
})
```

Maximal example:

```javascript
http2human('https://mycoolserver.com/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: { username: 'neil', password: 'nope' }
}).then(function(bodyObjectOrString) {
  // do something with your successful response
}).catch(function(err) {
  switch(err.name) {
   case 'NetworkError':
     console.error(err, err.stack);
     return alert("You might not be connected to the internet. Please check your connection and try again.");
   case 'ServerError':
     console.error(err, err.stack);
     if( err.suggestion ) { return alert(suggestion); }
     if( err.statusCode == 504 ) { return alert("Sorry, our server is backed up. Please try again later."); }
     if( err.responseBody ) { console.error(err.responseBody); }
     return alert("Sorry, something went wrong on our end. Please try again or email support@mycoolapp.com.");
   case 'UserError':
     if( err.suggestion ) { return alert(suggestion); }
     if( err.statusCode == 403 ) { return alert("Your username or password is incorrect") }
     if( err.responseBody && err.responseBody.retriesRemaining ) { return alert(`You have ${err.responseBody.retriesRemaining}`); }
     return alert("Hmm, something's wrong with your last request but we can't tell exactly what it is. Please check your information and try resubmitting or email support@mycoolapp.com")
   case 'LowLevelError':
   default:
     return alert("Whoa, something went wrong that should not have gone wrong. Please let us know what happened at bugs@mycoolapp.com")
  }
})
```

<span style="color: indianred">http2human will not work with all APIs</span>. it assumes:

1. API responses are in JSON or plaintext
2. 5xx responses strictly indicate an unexpected server side error.
3. 4xx responses strictly indicate a user error that should be resolvable by the human on the other side.

In order to populate `err.suggestion`, the format of an error message suggesting `foo` must be one of the following:

```js
{
  "error": {
    "message": "foo"
  }
}
```

```js
{
  "message": "foo"
}
```

```js
{
  "error": "foo"
}
```

```text
foo
```

`fetch` is a new standard available in modern browsers and react native. If `fetch` is not available in your environment, http2human will use https://github.com/bitinn/node-fetch
