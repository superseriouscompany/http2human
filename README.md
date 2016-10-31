# http2human

http2human tries to translate http errors for human use. It wraps `fetch` promises and returns standardized errors.

When a request to your server from a device actually succeeds, it's nothing short of a small miracle.
When it doesn't, a generic error message is dehumanizing to the person attempting to use your service.

Example usage:

```javascript
const request = http2human('https://mycoolserver.com/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: { username: 'neil', password: 'nope' }
}).then(function(bodyObjectOrString) {
  // do something with your successful response
}).then(function(err) {
  switch(err.name) {
   case 'NetworkError':
     return alert("You might not be connected to the internet. Please check your connection and try again.");
   case 'ServerError':
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
3. 4xx responses strictly indicate a user error.

In order to pass through the user facing suggestion from your API, the format of an error message suggesting `foo` must be one of the following:

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

```text
foo
```

If `fetch` is not available in your environment, http2human will use https://github.com/github/fetch
