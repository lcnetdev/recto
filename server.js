const express = require('express');
var cors = require('cors');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const profile = "/bfe/static/profiles/bibframe/";
const resources = "/resources/";
const fs = require('fs');
var _ = require('underscore');
var proxy = require('http-proxy-middleware');
var request = require('request');

var $rdf = require('rdflib');
var SaxonJS = require('saxon-js');

const dotenv = require('dotenv');
dotenv.config();
const appPort = process.env.APPPORT || 3000;
const versoProxyAddr = process.env.VERSO_PROXY || 'http://localhost:3030';
const bfdbhost = process.env.BFDBHOST ||  'preprod-8230.id.loc.gov'
const JAVA_HOME = process.env.JAVA_HOME;
const JENA_HOME = process.env.JENA_HOME;
const JENA_RIOT = process.env.JENA_RIOT;
const postToDir = process.env.POST_TO_DIR;
const TMPDIR = process.env.TMPDIR ||  '/tmp/'
const TD = process.env.TD ||  '/tmp/'
const XSLTCMD = process.env.XSLTCMD ||  'xsltproc %STYLESHEET% %SOURCE%'

console.log(versoProxyAddr);
var versoProxy = proxy({target: versoProxyAddr, pathRewrite: {'^/verso' : '/verso', '^/verso/explorer': '/explorer'}});
app.use("/verso", versoProxy);

app.use(cors());
app.use(bodyParser.json({
    limit: '250mb',
    verify: function (req, res, buf, encoding) {
        req.rawBody = buf;
    }
}));

app.use(bodyParser.urlencoded({
    extended: false,
    limit: '250mb'
}));

app.use(bodyParser.json({limit:'250mb'}));

app.use(express.static(__dirname + '/'));

app.use('/profile-edit', express.static(path.join(__dirname, '/profile-edit/source')));
app.use('/bfe', express.static(path.join(__dirname, '/bfe')));

app.listen(appPort, function() {
  console.log('listening on ' + appPort);
})

app.use(function(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('%s %s %s', req.method, req.url, req.path);
    try {
        console.error('Bad JSON: ' + req.rawBody);
    } catch (e) {
        console.error('Bad JSON: ' + e.message);
    } finally {
        res.status(200).send();
    }
  } else if (err) {
    console.log('Error: '+ err.message)
    res.send(err.message);
  } else {
    next();
  }
});

//RESTful route
//BFE
var apirouter = express.Router();

apirouter.use(function(req, res, next) {
    console.log(req.method, req.url);
    next();
});

var api_list = apirouter.route('/list');

api_list.get(function(req,res){
   //fs.readFile( __dirname + "/" + "descriptions.json", 'utf8', function (err, data) {
       //console.log( data );
   //    res.json( JSON.parse(data) );
   //});
    console.log('api/list called:' + req.url + ' ' + req.body);
    data = "Found"
    res.set('Content-Type', 'text/html');
    res.status(200).send(data);
})

var api_get = apirouter.route('/:id');

api_get.get(function (req, res) {
   // First read existing users.
   //fs.readFile( __dirname + "/" + "descriptions.json", 'utf8', function (err, data) {
   //     var json = JSON.parse( data );
   //     var description = _.where(json, {id: + req.params.id});
        //console.log(description);
   //     res.json(description);
   //});
   console.log('api/:id called:' + req.url + ' ' + req.body);
})

//Profile Edit
var router = express.Router();
router.use(function(req, res, next) {
    console.log(req.method, req.url);
    next();
});

var prof_getFile = router.route('/getFile/:filename')

prof_getFile.get(function(req,res){
  function afterResponse (){
   // Delete the download session
    fs.unlink(dirname + file + '_tmp', function(err) {
      if (err) throw err;
      console.log('cleanup');
    });
   }

  var fs = require('fs');
  var file = req.params.filename;
  var dirname = __dirname + profile;
  res.contentType('application/json');
  console.log('downloding ' + dirname + file);
  res.download(dirname + file + '_tmp', file);

  res.on('finish', afterResponse);

});

//bfe routes
var bferouter = express.Router();
// var bfe_rdfxml = bferouter.route('/rdfxml');
var prof_rdfxml = router.route('/rdfxml');

prof_rdfxml.post(function(req, res){
	var rdfTranslator = require('rdf-translator');
	//var xml = require('xml');
	var json = JSON.stringify(req.body);
	console.log(json);
	rdfTranslator(json, 'json-ld', 'pretty-xml', function(err, data){
	//  if (err) return console.error(err);
    //  console.log(data);
    if (err) res.status(500);

	res.set('Content-Type', 'application/rdf+xml');
	res.status(200).send(data);
	});
});


// var bfe_turtle2rdfxml = bferouter.route('/n3/rdfxml');
var prof_turtle2rdfxml = router.route('/n3/rdfxml');
/*
prof_turtle2rdfxml.post(function(req, res){
        var rdfTranslator = require('rdf-translator');
        var n3 = req.body.n3;
        rdfTranslator(n3, 'n3', 'pretty-xml', function(err, data){
           //if (err) res.status(500);
           //res.set('Content-Type', 'application/rdf+xml');
           //res.status(200).send(data);
           console.log(data)
            SaxonJS.transform({
                stylesheetFileName: "typeNormalize.sef.json",
                sourceText: data.toString(),
                destination: "serialized"
            }, "async")
            .then (output => {
                res.set('Content-Type', 'application/rdf+xml');
                res.status(200).send(output.principalResult);
            })
            .catch(function (err) {
                            // POST failed...
                            res.status(500).send(err);
                        });
        });
});
*/

prof_turtle2rdfxml.post(function(req, res){
        var n3 = req.body.n3;
        var fs = require('fs');
        var shortuuid = require('short-uuid');
        var decimaltranslator = shortuuid("0123456789");

        const { exec } = require('child_process');
        var tmpFile = TD + decimaltranslator.fromUUID(shortuuid.uuid()) + ".ttl";
        
        fs.writeFile(tmpFile, n3, function(err) {
            if(err) {
                return console.log(err);
            }
            
            //console.log(JENA_RIOT + " --formatted=rdfxml " + tmpFile + " {env: {'JENA_HOME': " + JENA_HOME + ", JAVA_HOME': " + JAVA_HOME + ", 'TMPDIR': "+ TD +"}}")
            exec(JENA_RIOT + " --formatted=rdfxml " + tmpFile , {env: {'JENA_HOME': JENA_HOME, 'JAVA_HOME': JAVA_HOME, 'TMPDIR': TD}}, (err, stdout, stderr) => {
                if (err) {console.log(stderr); res.status(500);}
                    fs.writeFileSync(tmpFile, stdout);
                    xslcmd = XSLTCMD;
                    xslcmd = xslcmd.replace('%STYLESHEET%', 'typeNormalize.xslt');
                    xslcmd = xslcmd.replace('%SOURCE%', tmpFile);
                    //console.log(xslcmd);
                    exec(xslcmd, {env: {'JAVA_HOME': JAVA_HOME, 'TMPDIR': TD}}, (err, stdout, stderr) => {
                        if (err) {console.log(stderr); res.status(500);}
                        var data = stdout;
                        res.set('Content-Type', 'application/rdf+xml');
                        res.status(200).send(data);
                        if (fs.existsSync(tmpFile)){
                            fs.unlinkSync(tmpFile);
                        }
                    });
                    /*
                    SaxonJS.transform({
                        stylesheetFileName: "typeNormalize.sef.json",
                        sourceFileName: tmpFile,
                        destination: "serialized"
                    }, "async")
                    .then (output => {
                        response.writeHead(200, {'Content-Type': 'application/rdf+xml'});
                        response.write(output.principalResult);
                        response.end();
                    })
                    .catch(function (err) {
                            // POST failed...
                            res.status(500).send(err);
                    });
                    */
            });
        });

    /*
    var mimeType = 'text/n3';
    var baseURI = "http://localhost/";
    var store = $rdf.graph();
    console.log(req.body);
            $rdf.parse(n3, store, baseURI, mimeType);
            $rdf.serialize(undefined, store, baseURI, 'application/rdf+xml', function(err, str){
                console.log(str);
                res.set('Content-Type', 'application/rdf+xml');
                res.status(200).send(str);
            });
            
            / *
            SaxonJS.transform({
                stylesheetFileName: "typeNormalize.xslt",
                sourceText: str,
                destination: "serialized"
            }, "async")
            .then (output => {
                response.writeHead(200, {'Content-Type': 'application/rdf+xml'});
                response.write(output.principalResult);
                response.end();
            })
            .catch(function (err) {
                            // POST failed...
                            res.status(500).send(err);
                        })
                });
            */
});

var prof_rdfxml2jsonld = router.route('/rdfxml/jsonld');
prof_rdfxml2jsonld.post(function(req, res){
        var rdf = req.body.rdf;
        var fs = require('fs');
        var shortuuid = require('short-uuid');
        var decimaltranslator = shortuuid("0123456789");

        const { exec } = require('child_process');
        var tmpFile = TD + decimaltranslator.fromUUID(shortuuid.uuid()) + ".rdf";

        fs.writeFile(tmpFile, rdf, function(err) {
            if(err) {
                return console.log(err);
            }
            exec(JENA_RIOT + " --formatted=jsonld " + tmpFile , {env: {'JENA_HOME': JENA_HOME, 'JAVA_HOME': JAVA_HOME, 'TMPDIR': TD}}, (err, stdout, stderr) => {
            if (err) {console.log(stderr); res.status(500);}
               var data = stdout;
               res.set('Content-Type', 'application/json+ld');
               res.status(200).send(data);
               if(fs.existsSync(tmpFile)){
                    fs.unlinkSync(tmpFile);
               }
            });
        });
});

var prof_rdfxml2jsonld = bferouter.route('/jsonld/rdfxml');
prof_rdfxml2jsonld.post(function(req, res){
        var jsonld = req.body.rdf;
        var fs = require('fs');
        var shortuuid = require('short-uuid');
        var decimaltranslator = shortuuid("0123456789");

        const { exec } = require('child_process');
        var tmpFile = TD + decimaltranslator.fromUUID(shortuuid.uuid()) + ".jsonld";

        fs.writeFile(tmpFile, rdf, function(err) {
            if(err) {
                return console.log(err);
            }
            exec(JENA_RIOT + " --formatted=rdfxml " + tmpFile , {env: {'JENA_HOME': JENA_HOME, 'JAVA_HOME': JAVA_HOME, 'TMPDIR': TD}}, (err, stdout, stderr) => {
            if (err) {console.log(stderr); res.status(500);}
               var data = stdout;
               res.set('Content-Type', 'application/rdf+xml');
               res.status(200).send(data);
               if (fs.existsSync(tmpFile)){
                   fs.unlinkSync(tmpFile);
               }
            });
        });
});


//var bfe_post = bferouter.route('/publish');
var prof_publish = router.route('/publish');

prof_publish.post(function(req,res){
   var fs = require('fs');
   var objid = req.body.objid;
   var lccn = req.body.lccn;
   var dirname = __dirname + resources;
   var posted = "/marklogic/applications/natlibcat/admin/bfi/bibrecs/bfe-preprocess/valid/posted/";
   var name = req.body.name + ".rdf";
   try{
   var rdfxml = JSON.parse(req.body.rdfxml); 
   var path = dirname + name;
   //console.log(req.params);
   console.log(path);
   console.log('Publish POST: LCCN ' + lccn + ' Name: '+ name);
   if (fs.existsSync(posted+name)){
        fs.unlink(posted + name, function(err){
            if (err) {
                console.error("Error deleting " + name);
            } else {
                console.log("deleted " + name);
            }
       });
   }
   //console.log('2')
   fs.writeFile(path, rdfxml, {encoding: 'utf8', mode: 0o777} , function (err) {
    if (err) res.status(500);
    //console.log('3')    
    res.status(200).send({"name": name, "url": resources + name, "objid": objid, "lccn": lccn});
   });
   } catch (e) {
    console.log('Post Error:'+ e.message);
    res.status(500, e.message);
   }
});

//var bfe_publish_response = bferouter.rute('/publishRsp');
var prof_publish_response = router.route('/publishRsp');

prof_publish_response.post(function(req,res){
   var shortuuid = require('short-uuid');
   var decimaltranslator = shortuuid("0123456789");
   //var request = require('request');
   var rp = require('request-promise');
   req.setTimeout(500000);
   if(req.body.constructor === Object && Object.keys(req.body).length === 0) {
       throw new Error('publishRsp - req.body is empty');
   }

   var filename = req.body.name;
   if (filename !== path.basename(req.body.name)) {
       filename = path.basename(req.body.name, path.extname(req.body.name));
   }

   var name = "%7B%22where%22%3A%20%7B%22name%22%3A%20%22" + decimaltranslator.toUUID(filename.split(/[a-zA-Z]/)[1])+ "%22%7D%7D";
   var url = versoProxyAddr + "/verso/api/bfs?filter="+name;
   console.log(url);
   console.log('PublishRsp POST: filename ' + filename);
   console.log(req.body);

   var json = req.body;

   var options = {  uri: url,
                    json: true,
                    transform: function(body){
                        var postbody = body[0];
                        console.log('Transformed:'+ json.objid);
                        postbody.status = json.publish.status;
                        postbody.objid = json.objid;
                        return postbody;
                    }
                };
                //success
                console.log(json.objid + ' ' + json.publish.status);
                if (json.publish.status === "success"){
                rp(options).then(function (postbody) {
                    //var id = postbody.id;
                    delete postbody.id
                    var posturl = versoProxyAddr + "/verso/api/bfs/upsertWithWhere?where=%7B%22name%22%3A%20%22"+postbody.name+"%22%7D";
                    var postoptions = {
                        method: 'POST',
                        uri: posturl,
                        body: postbody,
                        json: true // Automatically stringifies the body to JSON
                    };

                    rp(postoptions)
                        .then(function (parsedBody) {
                            res.status(200).send('parsedBody');
                        })
                        .catch(function (err) {
                            // POST failed...
                            res.status(500).send(err);
                        })
                   //res.status(200).send('publishRsp');
                })
                } else {
                    console.log ("Publish status:" + json.publish.status + " " + json.name + " " + json.publish.message);
                    res.status(200).send('Publish status:' + json.publish.status + " " + json.name);
                }
                //res.status(200).send("publishRsp2");
});

var prof_retrieveOCLC = bferouter.route('/retrieveOCLC');

prof_retrieveOCLC.get(function(req, res) {
    var oclcnum = req.query.oclcnum;
    var oclckey = req.query.oclckey;
    console.log('oclckey:' + oclckey);
    var oclcurl = `http://www.worldcat.org/webservices/catalog/content/${oclcnum}?wskey=${oclckey}`
    var rp = require('request-promise');
    var fs = require('fs');
    const { exec } = require('child_process');
    var tmpFile = TD + 'oclc.xml';
    var options = {uri:oclcurl}
    rp(options).then(function (postbody) {
        fs.writeFile(tmpFile, postbody,
            function(err) {
                if (err) { return res.status(500)};
                exec('yaz-record-conv ' + __dirname + '/configyaz.xml ' + TD + 'oclc.xml', (err, stdout, stderr) => {
                    if (err) {
                        console.log(stderr);
                        return res.status(500);
                    }
                    res.set('Content-Type', 'application/rdf+xml');
                    res.status(200).send(stdout);
                    if (fs.existsSync(tmpFile)){
                        fs.unlinkSync(tmpFile);
                    }
                })
            }
        )
    })
    .catch(function(err){
        console.log(err);
        res.status(500).send();
    })
    .catch(function(err){
        
        console.error(err); // This will print any error that was thrown in the previous error handler.
    });
});

//var bfe_retrieveLDS = bferouter.route('/retrieveLDS');
var prof_retrieveLDS = router.route('/retrieveLDS');

prof_retrieveLDS.get(function(req, res) {

    //var shortuuid = require('short-uuid');

    //var decimaltranslator = shortuuid("0123456789");

    //var request = require('request');

    var rp = require('request-promise');

    _ = require('lodash');

    var instanceURL = req.query.uri;

    var options = {
        uri: instanceURL,
        json: true
    };

    var workURL, itemURL;
    var jsonldReturn = [];

    console.log("RetrieveLDS");

    rp(options).then(function(instanceBody) {
        //workURL = _.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/"))[0]['bibframe:instanceOf']['@id']

        _.forEach(_.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/")), function(value) {
            if (!_.isEmpty(value['bibframe:instanceOf'])) {
                workURL = value['bibframe:instanceOf']['@id'];
                console.log("Work:" + workURL);                    
            }
        });

        if (_.some(_.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/")), "bibframe:hasItem")) {
            //itemURL = _.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/"))[0]['bibframe:hasItem']['@id']
            var itemURL;
            var itemURLs;            
            _.forEach(_.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/")), function(value) {
                if (!_.isEmpty(value['bibframe:hasItem']) && _.isArray(value['bibframe:hasItem'])) {
                    itemURLs = value['bibframe:hasItem'];
                } else if (!_.isEmpty(value['bibframe:hasItem'])) {
                    console.log(value['bibframe:hasItem']);
                    itemURLs = [];
                    itemURLs.push(value['bibframe:hasItem']);
                }
            });

            workURL = workURL.replace('id.loc.gov', bfdbhost) + '.jsonld';
            workURL = workURL.replace(/^(http:)/,"");
            jsonldReturn = _.concat(instanceBody, jsonldReturn);
            console.log("Load Work2:" + workURL);
            return rp({
                uri: workURL,
                json: true
            }).then(function(workBody) {
                console.log("Work Body");
                jsonldReturn[0]["@graph"] = _.concat(jsonldReturn[0]["@graph"], workBody["@graph"]);
                jsonldReturn[0]["@context"] = _.extend(jsonldReturn[0]["@context"], workBody["@context"]);

                if(!_.isEmpty(itemURLs)){
                    console.log("Load Item:" + itemURLs[0]);
                    for(var i=0;i<itemURLs.length;i++){
                        itemURL = itemURLs[i]["@id"].replace('id.loc.gov', bfdbhost) + '.jsonld';
                        return rp({
                            uri: itemURL,
                            json: true
                        }).then(function(itemBody) {
                            jsonldReturn[0]["@graph"] = _.concat(jsonldReturn[0]["@graph"], itemBody["@graph"]);
                            jsonldReturn[0]["@context"] = _.extend(jsonldReturn[0]["@context"], itemBody["@context"]);
                        }).catch(function (err){
                            console.log(err);
                        }).finally(function(){
                            //if (i == itemURLs.length)
                            //    res.status(200).send(jsonldReturn[0]);
                            console.log("item " + i + " done");
                        });
                    }
                } else {
                    /*console.log(JSON.stringify(itemURLs));
                    var ps = [];
                    for (var i=0;i<itemURLs.length;i++) {
                        console.log(i);
                        console.log(itemURLs[i]);
                        var itemURL = itemURLs[i]['@id'].replace('id.loc.gov', bfdbhost) + '.jsonld';
                        console.log(itemURL);
                        //jsonldReturn[0]["@graph"] = _.concat(jsonldReturn[0]["@graph"], workBody["@graph"]);
                        //jsonldReturn[0]["@context"] = _.extend(jsonldReturn[0]["@context"], workBody["@context"]);
                        var itemRequest = {uri:itemURL, json: true};
                        ps.push(rp(itemRequest));
                    }

                    Promise.all(ps)
                        .then((itemBody) => {
                            jsonldReturn[0]["@graph"] = _.concat(jsonldReturn[0]["@graph"], itemBody["@graph"]);
                            jsonldReturn[0]["@context"] = _.extend(jsonldReturn[0]["@context"], itemBody["@context"]);
                            res.status(200).send(jsonldReturn[0]);
                        }).catch(function (err){
                            res.status(500).send(err.message);
                            console.log(err);
                        })*/
                }
                console.log("junk");
                jsonldReturn[0]["@graph"] = _.concat(jsonldReturn[0]["@graph"], workBody["@graph"]);
                jsonldReturn[0]["@context"] = _.extend(jsonldReturn[0]["@context"], workBody["@context"]);
                //res.status(200).send(jsonldReturn[0]);
            }).catch(function (err){
                console.log(err);
            }).finally(function() {
                res.status(200).send(jsonldReturn[0]);
                console.log("done");
            });

        } else {
            jsonldReturn = _.concat(instanceBody, jsonldReturn);
            if (!_.isEmpty(workURL)){
                workURL = workURL.replace('id.loc.gov', bfdbhost) + '.jsonld';
                workURL.replace(/^(http:)/,"");
                console.log("Load Work:" + workURL);
                return rp({
                    uri: workURL,
                    json: true
                }).then(function(workBody) {
                    jsonldReturn[0]["@graph"] = _.concat(jsonldReturn[0]["@graph"], workBody["@graph"]);
                    jsonldReturn[0]["@context"] = _.extend(jsonldReturn[0]["@context"], workBody["@context"]);
                    res.status(200).send(jsonldReturn[0]);
                }).catch(function (err){
                    console.log(err);
                    res.status(500).send(err.message);
                });
            } 
            res.status(200).send(jsonldReturn[0]);
        }
    });

    //    res.status(200).send(jsonldReturn);

});
//var bfe_whichrt = bferouter.route('/whichrt');
var prof_whichrt = router.route('/whichrt');

prof_whichrt.get(function(req,res){
    //var request = require('request');
    var uri  = req.query.uri;
    req.pipe(request(uri)).pipe(res);
});

var prof_checkuri = router.route('/checkuri');

prof_checkuri.head(function(req,res){
    //var request = require('request');
    var uri  = req.query.uri;
    req.pipe(request.head(uri)).pipe(res);
});

app.use('/profile-edit/server', router);
app.use('/bfe/server', bferouter);
app.use('/api', apirouter);

var passport = require('passport');
var Strategy = require('passport-http').BasicStrategy;

passport.use(new Strategy(
  function(username, password, cb) {
    var options = {
	host: 'mlvlp01.loc.gov',
	port: '8201',
	path: '/authenticate.xqy',
	headers: {
		'Authorization': 'Basic' + new Buffer.alloc(username + ':' + password).toString('base64')
	}
    };
	var http = require('http');
    request = http.get(options, function(res){
        res.on('error', function(err) { console.log(err); });
    });
    
    cb;    

  }));

app.post('/login',
  passport.authenticate('basic', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: false })
);

module.exports = bferouter;
module.exports = router;
module.exports = apirouter;
module.exports = app;