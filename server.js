const express = require('express');
var cors = require('cors');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const profile = "/bfe/static/profiles/bibframe/";
const resources = "/data/";
const fs = require('fs');
var _ = require('underscore');
var request = require('request');

var $rdf = require('rdflib');
var SaxonJS = require('saxon-js');
var dataattributes = require('./lib/dataattributes');

const dotenv = require('dotenv');
dotenv.config();
const appPort = process.env.APPPORT || 3000;
const LDPJS_ADDR = process.env.LDPJS_ADDR || 'http://localhost:3000';
const bfdbhost = process.env.BFDBHOST ||  'preprod-8210.id.loc.gov';
const posturl = process.env.POSTURL;

const MONGO_COLLECTION = process.env.MONGO_COLLECTION || "resources";

const JAVA_HOME = process.env.JAVA_HOME;
const JENA_HOME = process.env.JENA_HOME;
const JENA_RIOT = process.env.JENA_RIOT;
const postToDir = process.env.POST_TO_DIR;
const TD = process.env.TD ||  '/tmp/'
const XSLTCMD = process.env.XSLTCMD ||  'xsltproc %STYLESHEET% %SOURCE%'
const RAPPERCMD = process.env.RAPPER_EXEC ||  'rapper'

const MLUSER = process.env.MLUSER;
const MLPASS = process.env.MLPASS;
const OCLCKEY = process.env.OCLCKEY;


const ldp = require("ldpjs");
//const ldp = require("../../ldpenv/ldpjs/index");
/******************************************/
var ldpconfig = {
    
    mongodb: {
        conn: "mongodb://localhost:27017"    ,
        db: "ldp",
        collection: MONGO_COLLECTION
    },

    useConverter: "riot",
    converters: {
        riot: {
            TD: TD,
            JAVA_HOME: JAVA_HOME,
            JENA_HOME: JENA_HOME,
            JENA_RIOT: JENA_RIOT,
        }
    },
    
    createIndexDoc: function(version) {
        var index = {};
        
        if (version.content.configType !== undefined) {
            // This is a 'config' thing.  A profile, probably.
            index.resourceType = version.content.configType;
            if (version.content.name !== undefined) {
                index.label = version.content.name;
            }
        }
        
        if (version.content.rdf !== undefined) {
            // We have a verso resource.
            index.resourceType = "resource";
            if (version.content.profile !== undefined) {
                index.profile = version.content.profile;
            }
            var rdf = JSON.parse(version.content.rdf);
            index.title = dataattributes.findTitle(rdf);
            index.lccn = dataattributes.findLccn(rdf);
            index.contribution = dataattributes.findContribution(rdf);
            index.catalogerid = dataattributes.findCatalogerId(rdf);
        }
        return index;
    }
};

ldp.setConfig(ldpconfig);
/******************************************/
app.use('/ldp', ldp);


app.use(cors());
app.use(bodyParser.json({
    limit: '250mb',
    verify: function (req, res, buf, encoding) {
        req.rawBody = buf;
    }
}));

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


var api_listwhere = apirouter.route('/list/');
api_listwhere.get(function (req, res) {
    
    var query = [];
    var view = req.query.view;
    
    var where = req.query.where;
    if ( where !== undefined ) {
        var matches = []
        if (typeof where === 'string') {
            var where_parts = where.split(":");
            var field = where_parts[0];
            var value = where_parts[1];
            matches.push({ $match: {[field]: {"$eq": value } } });
        } else if (typeof where === 'object') {
            where.forEach(function (w) {
                var where_parts = w.split(":");
                var field = where_parts[0];
                var value = where_parts[1];
                matches.push({ $match: {[field]: {"$eq": value } } });
            })
        }
        query = [
            ...matches,
            { $sort : {"modified": -1 } }  
        ];
    } else {
        var daysAgo = req.query.daysago;
        var d = new Date();
        d.setDate(d.getDate()-15);
        if (daysAgo !== undefined) {
            d = new Date();
            d.setDate(d.getDate()-parseInt(daysAgo));    
        }
        query = [
            // { $match: {"resource.modified": {"$gte": d } } },
            { $match: {"versions.content.modified": {"$gte": d } } },
            { $sort : {"modified": -1 } }
        ];
    }
    
    console.log(JSON.stringify(query));
    var url = LDPJS_ADDR + "/ldp/verso/resources";
    
    var options = {
        method: 'POST',
        uri: url,
        body: query,
        headers: {
            'Content-type': "application/x-mongoquery+json"
        },
        json: true // Automatically stringifies the body to JSON
    };

    var rp = require('request-promise');
    rp(options)
        .then(function (data) {
            /*
                kefo - note - 2020 08 31
                Asking for the last 60 days of resources takes the same 
                amount of time to fetch *locally* when passing the response 
                through or winnowing it down to only that which the application 
                needs.  HOWEVER, 60 days worth of data is 20MB versus less than 
                500Kb of winnowed data.
            */
            var items = [];
            data.results.forEach(function(d){
                var doc = d.data;
                doc.title = dataattributes.findTitle(doc.profile, doc.rdf);
                doc.lccn = dataattributes.findLccn(doc.rdf);
                doc.contribution = dataattributes.findContribution(doc.rdf);
                doc.catalogerid = dataattributes.findCatalogerId(doc.rdf);
                delete doc.rdf;
                delete doc.url;
                items.push(doc);
            });
            if (view === "text") {
                if (items.length > 0) {
                    fields = Object.keys(items[0]);
                    lines = ""
                    for (f of fields) {
                        lines += f + "  "
                    }
                    lines += "\n"
                    
                    for (d of items) {
                        for (f of fields) {
                            if (d[f] !== undefined) {
                                lines += d[f] + "  "
                            }
                        }
                        lines += "\n"
                    }
                    res.set('Content-Type', 'text/plain');
                    res.status(200).send(lines);
                } else {
                    res.set('Content-Type', 'text/plain');
                    res.status(200).send("No results found.");
                }
            } else {
                res.set('Content-Type', 'application/json');
                res.status(200).send(items);
            }
        })
        .catch(function (err) {
            // POST failed...
            console.log(err);
            res.status(500).send(err);
        });
});

var api_listconfigswhere = apirouter.route('/listconfigs/');
api_listconfigswhere.get(function (req, res) {
    
    var query = [];
    var view = req.query.view;
    
    var where = req.query.where;
    if ( where !== undefined ) {
        var matches = []
        if (typeof where === 'string') {
            var where_parts = where.split(":");
            var field = where_parts[0];
            var value = where_parts[1];
            matches.push({ $match: {[field]: {"$eq": value } } });
        } else if (typeof where === 'object') {
            where.forEach(function (w) {
                var where_parts = w.split(":");
                var field = where_parts[0];
                var value = where_parts[1];
                matches.push({ $match: {[field]: {"$eq": value } } });
            })
        }
        query = [
            ...matches,
            { $sort : {"modified": -1 } }  
        ];
    }
    
    console.log(JSON.stringify(query));
    var url = LDPJS_ADDR + "/ldp/verso/configs";
    
    var options = {
        method: 'POST',
        uri: url,
        body: query,
        headers: {
            'Content-type': "application/x-mongoquery+json"
        },
        json: true // Automatically stringifies the body to JSON
    };
    var rp = require('request-promise');
    rp(options)
        .then(function (data) {
            var items = [];
            data.results.forEach(function(d){
                var doc = d.data;
                doc.created = doc.metadata.createDate;
                doc.modified = doc.metadata.updateDate;
                if (view === "text") {
                    delete doc.json;
                    delete doc.metadata;
                }
                items.push(doc);
            });
            if (view === "text") {
                fields = Object.keys(items[0]);
                lines = ""
                for (f of fields) {
                    lines += f + "  "
                }
                lines += "\n"
                
                for (d of items) {
                    for (f of fields) {
                        if (d[f] !== undefined) {
                            lines += d[f] + "  "
                        }
                    }
                    lines += "\n"
                }
                res.set('Content-Type', 'text/plain');
                res.status(200).send(lines);
            } else {
                res.set('Content-Type', 'application/json');
                res.status(200).send(items);
            }
        })
        .catch(function (err) {
            // POST failed...
            console.log(err);
            res.status(500).send(err);
        });
});

var api_get = apirouter.route('/getStoredJSONLD/:id');
api_get.get(function (req, res) {
    var url = LDPJS_ADDR + "/ldp/verso/resources/" + req.params.id;
    var options = {
        method: 'GET',
        uri: url,
        json: true // Takes JSON as string and converts to Object
    };
    var rp = require('request-promise');
    rp(options)
        .then(function (data) {
            res.set('Content-Type', 'application/json');
            res.status(200).send(data.rdf);
        })
        .catch(function (err) {
            // POST failed...
            res.status(500).send(err);
        });
});


//Profile Edit
var router = express.Router();
router.use(function(req, res, next) {
    console.log(req.method, req.url);
    next();
});

var prof_getFile = router.route('/getFile/:filename');

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

        fs.writeFile(tmpFile, jsonld, function(err) {
            if(err) {
                return console.log(err);
            }
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
            });
        });
});


var prof_publish = router.route('/publish');
prof_publish.post(function(req,res){
    //var fs = require('fs');
    var shortuuid = require('short-uuid');
    var decimaltranslator = shortuuid("0123456789");
    var objid = req.body.objid;
    var lccn = req.body.lccn;
    var dirname = __dirname + resources;
    var name = req.body.name + ".rdf";
    var rdfxml = JSON.parse(req.body.rdfxml); 
    
    console.log(objid);
    console.log(lccn);
    
    var url = posturl;
    var options = {
        method: 'POST',
        uri: url,
        body: rdfxml,
        headers: { "Content-type": "application/xml" },
        auth: {
                'user': MLUSER,
                'pass': MLPASS,
            },
        resolveWithFullResponse: true,
        json: false // Takes JSON as string and converts to Object
    };
    var rp = require('request-promise');
    rp(options)
        .then(function (response) {
            // {"name": "72a0a1b6-2eb8-4ee6-8bdf-cd89760d9f9a.rdf","objid": "/resources/instances/c0209952430001",
            // "publish": {"status": "success","message": "posted"}}
            console.log("Response: ");
            console.log(response.body);
            data = {}
            if (response.body != undefined && response.body != "") {
                data = JSON.parse(response.body);
            }
            var location = "";
            if (response.headers['location'] !== undefined) {
                location = response.headers['location'];
                objid = location.replace('http://id.loc.gov', '');
            }
            console.log(location);
            
            var resp_data = {}
            if (response.statusCode == 201 || response.statusCode == 204) {
                // IF successful, it is by definition in this case also posted.
                resp_data = {
                        "name": name, 
                        "url": resources + name, 
                        "objid": objid, 
                        "lccn": lccn, 
                        "publish": {"status":"published"}
                    }
            } else {
                resp_data = {
                        "name": name, 
                        "objid":  objid, 
                        "publish": {"status": "error","message": data }
                    }
            }
            res.set('Content-Type', 'application/json');
            res.status(200).send(resp_data);
        })
        .catch(function (err) {
            // POST failed...
            console.log(err)
            resp_data = {
                    "name": req.body.name, 
                    "objid":  objid, 
                    "publish": {"status": "error","message": err }
                }
            res.set('Content-Type', 'application/json');
            res.status(500).send(resp_data);
        });
});


var prof_retrieveOCLC = bferouter.route('/retrieveOCLC');
prof_retrieveOCLC.get(function(req, res) {
    var oclcnum = req.query.oclcnum;
    var oclckey = OCLCKEY;
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

var prof_retrieveLDS = router.route('/retrieveLDS');
prof_retrieveLDS.get(function(req, res) {

    var rp = require('request-promise');
    _ = require('lodash');
    var instanceURL = req.query.uri;
    var resourceuri = req.query.uri.replace('.jsonld', '')
    resourceuri = resourceuri.replace('.json', '')
    resourceuri = resourceuri.replace('https:', 'http:')

    var options = {
        uri: instanceURL,
        headers: {
            'User-Agent': 'Recto/BFE Lookup'
        },
        json: true
    };

    var workURL, itemURL;
    var jsonldReturn = [];

    console.log("RetrieveLDS");
    console.log(instanceURL);

    rp(options)
    .then(function(instanceBody) {
        //workURL = _.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/"))[0]['bibframe:instanceOf']['@id']
        var workURL = null;
        console.log(resourceuri);
        if (!instanceURL.match(/editor-pkg/)){
            if (instanceBody["@graph"] !== undefined ) {
                // BFDB uses @graph.  ID does not.  This is for BFDB.
                _.forEach(_.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/")), function(value) {
                    if (!_.isEmpty(value['bibframe:instanceOf'])) {
                        workURL = value['bibframe:instanceOf']['@id'];
                        console.log("BFDB Work:" + workURL);                    
                    }
                });
            } else {
                /*
                    This is unused, presently.  14 Sept 2020
                    The Work URL is needed in order to fetch the Work so it 
                    can be added to the Instance to support simultaneous
                    editing of WOrk and Instance.  I think this is a bad idea,
                    which is why this is unused presently.  
                */
                instance = _.find(instanceBody, {"@id": resourceuri});
                if (instance["http://id.loc.gov/ontologies/bibframe/instanceOf"] !== undefined) {
                    work = _.find(instance["http://id.loc.gov/ontologies/bibframe/instanceOf"], "@id");
                    if (work !== undefined) {
                        workURL = work["@id"];
                        console.log("ID Work:" + workURL);
                    }
                }
            }
        } else {
            console.log("Editor Package Mode");
        }
        
        if (instanceBody["@graph"] !== undefined) {
            // BFDB uses @graph.  ID does not.  This is for BFDB.
            if (
                !instanceURL.match(/editor-pkg/) && 
                _.some(_.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/")), "bibframe:hasItem")
               ) {
            
                workURL = workURL.replace('id.loc.gov', bfdbhost) + '.jsonld';
                workURL = workURL.replace(/^(http:)/,"");
                jsonldReturn = _.concat(instanceBody, jsonldReturn);
                console.log("Load Work2:" + workURL);
                return rp({
                    uri: workURL,
                    headers: {
                        'User-Agent': 'Recto/BFE Lookup'
                    },
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
        
        } else {
            // instanceBody does not contain @graph.  Let's presume this is ID.
            res.status(200).send(instanceBody);
        }
            
    })
    .catch(function(err) {
        console.log(err);
        res.status(500).send(err.message);
    });

    //    res.status(200).send(jsonldReturn);

});
//var bfe_whichrt = bferouter.route('/whichrt');
var prof_whichrt = router.route('/whichrt');

prof_whichrt.get(function(req,res){
    //var request = require('request');
    var uri  = req.query.uri;
    if ( !uri.startsWith("http") && uri.startsWith('/') ) {
        uri = LDPJS_ADDR + uri
    };
    //req.pipe(request(uri)).pipe(res);
    if ( uri.indexOf('bibframe.example.org') > 0 ) {
        res.status(404).send();
    } else {
        req.pipe(request(uri))
        .on('error', function(err) {
            console.error(err);
            res.status(500).send('Error fetching resource via whichrt.');
        })
        .pipe(res);
    }
});

var prof_checkuri = router.route('/checkuri');

prof_checkuri.head(function(req,res){
    //var request = require('request');
    var uri  = req.query.uri;
    req.pipe(request.head(uri)).pipe(res);
});

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

app.use('/profile-edit/server', router);
app.use('/bfe/server', bferouter);
app.use('/api', apirouter);

module.exports = bferouter;
module.exports = router;
module.exports = apirouter;
module.exports = app;
