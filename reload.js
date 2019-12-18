'use strict';
var fs = require('fs');
var request = require('request');
var shortUUID = require('short-uuid');
var jsonld = require('jsonld');
var file = process.argv[2]
var _ = require('underscore');

var rdf = fs.readFileSync(file, 'utf8');
var input = {};
    input.rdf = rdf;

var modDate = new Date(fs.statSync(file).mtime);

  request.post(
    {
      url: 'http://localhost:3000/profile-edit/server/rdfxml/jsonld',
      header: 'Content-Type: application/json',
      json: input
    },
    function(err, res, body) {
      if (err) {
        console.log('error:' + err);
      } else {
//        console.log(body)
        jsonld.expand(body, "", function (err, jsonld) {
            //console.log(jsonld);
            var save_json = {};
            var name = guid();
            save_json.name = name;
            save_json.profile = findProperty(jsonld, 'http://id.loc.gov/ontologies/bflc/profile');
            save_json.url = "http://mlvlp04.loc.gov:3000/verso/api/bfs/upsertWithWhere?where=%7B%22name%22%3A%20%22"+name+"%22%7D";//bfeditor.bfestore.url;
            save_json.created = modDate;
            save_json.modified = modDate;
            save_json.status = "success";
            save_json.addedproperties = [];
            save_json.rdf = jsonld;        
            console.log(save_json);
            request.post({
                url: save_json.url,
                json:save_json,
            }, function (err, res, body) {
                if (err) {
                    console.log('error:' + err);
                } else {
                    console.log("Saved " + body.id);
                }
            });
        });
      }
    });
  //                ).on('error', (err) => {
  //                    console.error(err);
  //                }).on('finish'), (res) => {
  //                    console.log(i)
  //                };
  // }

  function guid() {
    var translator = shortUUID();
    return translator.uuid();
  }

  function shortUUID(uuid) {
    var translator = shortUUID();
    return translator.fromUUID(uuid);
  }

  function mintResource(uuid) {
    var decimaltranslator = shortUUID('0123456789');
    return 'e' + decimaltranslator.fromUUID(uuid);
  }

function findProperty (data, property){
    var text = '';
    var ma = _.findKey(data, property);
    //console.log(property + ':' + ma)
    if (!_.isEmpty(ma)){
        text = _.pluck(data[ma][property], '@value')[0];
    }
    return text;
  }
