const expect  = require('expect');
const express = require('express');
const request = require('request');
const h2h     = require('../index');
const app     = express();

const port = process.env.PORT || 6969;

describe('http2human', function() {
  before(function() {
    app.get('/json200', function(req, res) { res.send(JSON.stringify({cool: 'nice'})); });
    app.get('/text200', function(req, res) { res.send('nice'); });
    app.get('/json201', function(req, res) { res.send(JSON.stringify({created: true})); });
    app.get('/text201', function(req, res) { res.sendStatus(201) });

    app.get('/text4xx', function(req, res) { res.status(400).send('wrong')});
    app.get('/json4xxnaked', function(req, res) { res.status(422).send(JSON.stringify({error: 'nope'})) });
    app.get('/json4xxnakedAlternate', function(req, res) { res.status(422).send(JSON.stringify({message: 'nope'})) });
    app.post('/json4xxwrapped', function(req, res) { res.status(409).send(JSON.stringify({error: {message: 'nope'}})) });

    app.get('/text5xx', function(req, res) { res.status(500).send('wrong')});
    app.get('/json5xxnaked', function(req, res) { res.status(502).send(JSON.stringify({error: 'nope'})) });
    app.get('/json5xxnakedAlternate', function(req, res) { res.status(503).send(JSON.stringify({message: 'nope'})) });
    app.post('/json5xxwrapped', function(req, res) { res.status(504).send(JSON.stringify({error: {message: 'nope'}})) });

    app.get('/timeout', function(req, res) { setTimeout(function() { res.send('ok')}, 10000)});

    app.listen(port);
  })

  describe('successful responses', function() {
    it('parses json if response is json', function(done) {
      h2h('http://localhost:6969/json200').then(function(response) {
        expect(response.cool).toEqual('nice');
        done();
      }).catch(done);
    });

    it('returns text if response is text', function(done) {
      h2h('http://localhost:6969/text200').then(function(response) {
        expect(response).toEqual('nice');
        done();
      }).catch(done);
    })

    it('parses json for 201', function(done) {
      h2h('http://localhost:6969/json201').then(function(response) {
        expect(response.created).toExist();
        done();
      }).catch(done);
    });

    it('returns text for 201', function(done) {
      h2h('http://localhost:6969/text201').then(function(response) {
        expect(response).toEqual('Created');
        done();
      }).catch(done);
    })
  })

  describe('errors', function() {
    describe('user errors', function() {
      it('parses and tags', function (done) {
        h2h('http://localhost:6969/text4xx').then(done).catch(function(err) {
          expect(err.name).toEqual('UserError');
          expect(err.suggestion).toEqual('wrong');
          expect(err.statusCode).toEqual(400);
          expect(err.responseBody).toEqual({rawText: 'wrong'});
          done();
        }).catch(done);
      });

      it('parses json error like {"message": "nope"}', function(done) {
        h2h('http://localhost:6969/json4xxnakedAlternate').then(done).catch(function(err) {
          expect(err.name).toEqual('UserError');
          expect(err.suggestion).toEqual('nope');
          expect(err.statusCode).toEqual(422);
          expect(err.responseBody).toEqual({message: 'nope'});
          done();
        }).catch(done);
      })

      it('parses json error like {"error": "nope"}', function(done) {
        h2h('http://localhost:6969/json4xxnaked').then(done).catch(function(err) {
          expect(err.name).toEqual('UserError');
          expect(err.suggestion).toEqual('nope');
          expect(err.statusCode).toEqual(422);
          expect(err.responseBody).toEqual({error: 'nope'});
          done();
        }).catch(done);
      })

      it('parses json error like {"error": {"message": "nope"}}', function(done) {
        h2h('http://localhost:6969/json4xxwrapped', {method: 'POST'}).then(done).catch(function(err) {
          expect(err.name).toEqual('UserError');
          expect(err.suggestion).toEqual('nope');
          expect(err.statusCode).toEqual(409);
          expect(err.responseBody).toEqual({error: {message: 'nope'}});
          done();
        }).catch(done);
      })
    })

    describe('server errors', function() {
      it('parses and tags', function (done) {
        h2h('http://localhost:6969/text5xx').then(done).catch(function(err) {
          expect(err.name).toEqual('ServerError');
          expect(err.suggestion).toEqual('wrong');
          expect(err.statusCode).toEqual(500);
          expect(err.responseBody).toEqual({rawText: 'wrong'});
          done();
        }).catch(done);
      });

      it('parses json error like {"error": "nope"}', function(done) {
        h2h('http://localhost:6969/json5xxnaked').then(done).catch(function(err) {
          expect(err.name).toEqual('ServerError');
          expect(err.suggestion).toEqual('nope');
          expect(err.statusCode).toEqual(502);
          expect(err.responseBody).toEqual({error: 'nope'});
          done();
        }).catch(done);
      })

      it('parses json error like {"message": "nope"}', function(done) {
        h2h('http://localhost:6969/json5xxnakedAlternate').then(done).catch(function(err) {
          expect(err.name).toEqual('ServerError');
          expect(err.suggestion).toEqual('nope');
          expect(err.statusCode).toEqual(503);
          expect(err.responseBody).toEqual({message: 'nope'});
          done();
        }).catch(done);
      })

      it('parses json error like {"error": {"message": "nope"}}', function(done) {
        h2h('http://localhost:6969/json5xxwrapped', {method: 'POST'}).then(done).catch(function(err) {
          expect(err.name).toEqual('ServerError');
          expect(err.suggestion).toEqual('nope');
          expect(err.statusCode).toEqual(504);
          expect(err.responseBody).toEqual({error: {message: 'nope'}});
          done();
        }).catch(done);
      })
    })

    describe('timeouts', function() {
      it('respects timeout parameter', function(done) {
        this.timeout(200);
        h2h('http://localhost:6969/timeout', null, 100).then(done).catch(function(err) {
          expect(err.name).toEqual('TimeoutError');
          done();
        }).catch(done);
      })
    })
  })
})
