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
})
