const request = require("supertest");
const express = require("express");

const fs = require('fs');

const server = require("../server");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use("/", server);

describe('GET /bfe/', function() {
  it('responds with 200 and html', function(done) {
    request(app)
      .get('/bfe/')
      .expect('Content-Type', /html/)
      .expect(200 ,done);
  });
});

describe('GET /profile-edit/', function() {
  it('responds with 200 and html', function(done) {
    request(app)
      .get('/bfe/')
      .expect('Content-Type', /html/)
      .expect(200 ,done);
  });
});

describe('POST /profile-edit/server/n3/rdfxml', function() {
    it('responds with 200 and rdfxml', function(done) {
        this.timeout(5000);
        fs.readFile( __dirname + "/data/n3.json", 'utf8', function (err, data) {
            if (err) throw err;
            jsonobj = JSON.parse(data);
            request(app)
              .post('/profile-edit/server/n3/rdfxml')
              .send(jsonobj)
              .set('Content-Type', 'application/json')
              .expect(function contains(res) {
                if (res.text.indexOf('<bf:Instance rdf:about="http://id.loc.gov/resources/instances/c0208479150001">') == -1) {
                    throw new Error('Did not find:  <bf:Instance rdf:about="http://id.loc.gov/resources/instances/c0208479150001">');
                }
              })
              .expect(200, done);
        });
    });
});

describe('POST /profile-edit/server/rdfxml/jsonld', function() {
    it('responds with 200 and jsonld', function(done) {
        this.timeout(5000);
        fs.readFile( __dirname + "/data/rdfxml.json", 'utf8', function (err, data) {
            if (err) throw err;
            jsonobj = JSON.parse(data);
            request(app)
              .post('/profile-edit/server/rdfxml/jsonld')
              .send(jsonobj)
              .set('Content-Type', 'application/json')
              .expect(function contains(res) {
                if (res.text.indexOf('"@id" : "http://mlvlp04.loc.gov:3000/resources/e33871358624467496079390388902946843574",') == -1) {
                    throw new Error('Did not find:  "@id" : "http://mlvlp04.loc.gov:3000/resources/e33871358624467496079390388902946843574",');
                }
              })
              .expect(200, done);
        });
    });
});

describe('POST /bfe/server/jsonld/rdfxml', function() {
    it('responds with 200 and rdfxml', function(done) {
        this.timeout(5000);
        fs.readFile( __dirname + "/data/jsonld.json", 'utf8', function (err, data) {
            if (err) throw err;
            jsonobj = JSON.parse(data);
            request(app)
              .post('/bfe/server/jsonld/rdfxml')
              .send(jsonobj)
              .set('Content-Type', 'application/json')
              .expect(function contains(res) {
                if (res.text.indexOf('<bf:Work rdf:about="http://id.loc.gov/resources/works/c020847915">') == -1) {
                    throw new Error('Did not find:  <bf:Work rdf:about="http://id.loc.gov/resources/works/c020847915">');
                }
              })
              .expect(200, done);
        });
    });
});

/*
const assert = require('assert');describe('Simple Math Test', () => {
 it('should return 2', () => {
        assert.equal(1 + 1, 2);
    });
 it('should return 9', () => {
        assert.equal(3 * 3, 9);
    });
});
*/