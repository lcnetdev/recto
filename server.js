const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const profile = "/bfe/static/profiles/bibframe/";
const resources = "/resources/";
const fs = require('fs');
const _ = require('underscore');
var proxy = require('http-proxy-middleware');

versoProxy = proxy({target: 'http://mlvlp04.loc.gov:3001', pathRewrite: {'^/verso' : '/verso'
//, '^/explorer': '/'
}});

app.use("/verso", versoProxy);

//app.get('/', function(req, res) {
//  res.sendFile(__dirname + '/editor.html')
//})

app.use(bodyParser.urlencoded({
    extended: false,
    limit: '250mb'    
}));

app.use(bodyParser.json({limit:'250mb'}));

app.use(express.static(__dirname + '/'));

app.use('/profile-edit', express.static(path.join(__dirname, '/profile-edit/source')));
app.use('/bfe', express.static(path.join(__dirname, '/bfe')));

app.listen(3000, function() {
  console.log('listening on 3000');
})


//RESTful route
//BFE
var apirouter = express.Router();

apirouter.use(function(req, res, next) {
    console.log(req.method, req.url);
    next();
});

var api_list = apirouter.route('/list');

api_list.get(function(req,res){
   fs.readFile( __dirname + "/" + "descriptions.json", 'utf8', function (err, data) {
       //console.log( data );
       res.json( JSON.parse(data) );
   });
})

var api_get = apirouter.route('/:id');

api_get.get(function (req, res) {
   // First read existing users.
   fs.readFile( __dirname + "/" + "descriptions.json", 'utf8', function (err, data) {
        json = JSON.parse( data );
        var description = _.where(json, {id: + req.params.id});
        //console.log(description);
        res.json(description);
   });
})

//Profile Edit
var router = express.Router();

router.use(function(req, res, next) {
    console.log(req.method, req.url);
    next();
});

var prof_list = router.route('/list');

prof_list.get(function(req,res,next){
  var fs = require('fs');
  var dirname = __dirname + profile;
  var json = new Array();
  var filenames = fs.readdirSync(dirname);
  console.log(filenames.length);
  filenames.forEach(function(filename) {
      json.push(JSON.parse(fs.readFileSync(dirname + filename, 'utf-8')));
    });
  res.contentType('application/json');
  res.send(JSON.stringify(json));
});

var prof_get = router.route('/get/:profile');

prof_get.get(function(req,res,next){
  var fs = require('fs');
  var file = req.params.profile
  var dirname = __dirname + profile;
  if (fs.existsSync(dirname + file + '.json')) {
    var json = JSON.parse(fs.readFileSync(dirname + file + '.json', 'utf-8'));
    res.contentType('application/json');
    res.send(JSON.stringify(json));
  } else {
    res.status = 404;
    res.send("File does not exist");
  }
});

var prof_getTemplateRefs = router.route('/getTemplateRefs')

prof_getTemplateRefs.get(function(req,res,next){
  var fs = require('fs');

  file_name = __dirname + '/profile-edit/source/templateRefs/templateRefs';

var readline = require('readline');

var lineReader = readline.createInterface({
    input: fs.createReadStream(file_name)
});

function parseLine(line) {
    return line;
}

function createRowObject(values) {
    var rowObject = values.trim().replace('/\s\s+/', '');

    return rowObject;
}

var json = {};
json = [];

lineReader.on('line', function (line) {
   json.push(createRowObject(line));
});

lineReader.on('close', function () {
   res.send(json);
});

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

var prof_save = router.route('/save');

prof_save.post(function(req,res){

   var fs = require('fs');
   var dirname = __dirname + profile;
   var name = req.body.name;
   var json = req.body.json;
   var path = dirname + name;
   //console.log(req.params);
   console.log(path);
   console.log('Got a POST request');
   fs.writeFile(path, json, {encoding: 'utf8', mode: 0o777} , function (err) {
    res.status(200);
    res.redirect("back");
   });
});


var prof_delete = router.route('/delete');

prof_delete.delete(function(req,res, next){

   var fs = require('fs');
   var dirname = __dirname + profile;
   var name = req.query.name;
   var path = dirname + name;

   console.log('Got a DELETE request');

   fs.unlink(path, (err) => {

     if (err) throw err;
     console.log('deleted ' + path);
     res.status(200).send("Deleted");
   });

});

var prof_import = router.route('/import');

prof_import.post(function(req,res){

   var fs = require('fs');
   var dirname = __dirname + profile;
   var name = req.body.tmp_name;
   var json = req.body.file;
   var path = dirname + tmp_name;
   console.log(req.body);
   console.log(req.params);
   res.status(200);

});

var prof_rdfxml = router.route('/rdfxml');

prof_rdfxml.post(function(req, res){
	var rdfTranslator = require('rdf-translator');
	var xml = require('xml');
	var json = JSON.stringify(req.body);
	console.log(json);
	rdfTranslator(json, 'json-ld', 'pretty-xml', function(err, data){
	//  if (err) return console.error(err);
    	//  console.log(data);
//  	if (err) res.status(500);

	res.set('Content-Type', 'application/rdf+xml');
	res.status(200).send(data);
	});
});

var prof_turtle2rdfxml = router.route('/n3/rdfxml');

prof_turtle2rdfxml.post(function(req, res){
        var rdfTranslator = require('rdf-translator');
        var n3 = req.body.content;
	console.log(n3);
        rdfTranslator(n3, 'n3', 'pretty-xml', function(err, data){
           if (err) res.status(500);
           res.set('Content-Type', 'application/rdf+xml');
           res.status(200).send(data);
        });
});

var prof_publish = router.route('/publish');

prof_publish.post(function(req,res){
   console.log(req.body);
   var fs = require('fs');
   var objid = req.body.objid;
   var lccn = req.body.lccn;
   var dirname = __dirname + resources;
   var posted = "/marklogic/applications/natlibcat/admin/bfi/bibrecs/bfe-preprocess/valid/posted/";
   var name = req.body.name + ".rdf";
   var rdfxml = JSON.parse(req.body.rdfxml); 
   var path = dirname + name;
   //console.log(req.params);
   console.log(path);
   console.log('Got a POST request');

   if (fs.existsSync(posted+name)){
        fs.unlinkSync(posted + name, function(err){
            if (err) {
                console.error("Error deleting " + name);
            }
       });
   }

   fs.writeFile(path, rdfxml, {encoding: 'utf8', mode: 0o777} , function (err) {
    if (err) res.status(500);    
    res.status(200).send({"name": name, "url": resources + name, "objid": objid, "lccn": lccn});
   });
});

var prof_publish_response = router.route('/publishRsp');

prof_publish_response.post(function(req,res){
   console.log(req.body);
   var shortuuid = require('short-uuid');
   var decimaltranslator = shortuuid("0123456789");
   var request = require('request');
   var rp = require('request-promise');
    
   var filename = req.body.name;
   if (filename !== path.basename(req.body.name)) {
        filename = path.basename(req.body.name, path.extname(req.body.name));
   }

   var name = "%7B%22where%22%3A%20%7B%22name%22%3A%20%22" + decimaltranslator.toUUID(filename.split(/[a-zA-Z]/)[1])+ "%22%7D%7D";
   var url = "http://localhost:3000/verso/api/bfs?filter="+name;
   console.log(url);
   console.log('Got a POST request');

   var json = req.body;

   var options = {  uri: url,
                    json: true,
                    transform: function(body){
                        var postbody = body[0];
                        postbody.status = json.publish.status;
                        postbody.objid = json.objid;
                        return postbody;
                    }
                };
                if (json.publish.status === "success"){
                rp(options).then(function (postbody) {
                    var id = postbody.id;
                    delete postbody.id
                    var posturl = "http://mlvlp04.loc.gov:3000/verso/api/bfs/upsertWithWhere?where=%7B%22name%22%3A%20%22"+postbody.name+"%22%7D";
                    var postoptions = {
                        method: 'POST',
                        uri: posturl,
                        body: postbody,
                        json: true // Automatically stringifies the body to JSON
                    };

                    rp(postoptions)
                        .then(function (parsedBody) {
                            res.status(200).send(parsedBody);
                        })
                        .catch(function (err) {
                            // POST failed...
                            res.status(404).send(err);
                        });
                })
                } else {
                    console.log ("Publish error");
                    res.status(404).send(json);
                }
//                            res.status(200).send({"name": name, "objid": objid});
});


var prof_retrieveLDS = router.route('/retrieveLDS');

prof_retrieveLDS.get(function(req, res){

    var shortuuid = require('short-uuid');
    
    var decimaltranslator = shortuuid("0123456789");
    
    var request = require('request');
    
    var rp = require('request-promise');
    
    var _ = require('lodash');
    
    var instanceURL = req.query.uri;
    
    var options = { uri:instanceURL, 
                    json:true
                  };
    
    var workURL, itemURL;
    var jsonldReturn = [];

    rp(options).then(function (instanceBody){
        workURL = _.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/"))[0]['bibframe:instanceOf']['@id']
        if (_.some(_.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/")), "bibframe:hasItem")) {
        itemURL = _.filter(instanceBody["@graph"], p => _.includes(p["@id"], "http://id.loc.gov/resources/"))[0]['bibframe:hasItem']['@id']
        workURL = workURL.replace('id.loc.gov', 'mlvlp04.loc.gov:8230') + '.jsonld';
        jsonldReturn = _.concat(instanceBody, jsonldReturn);
        console.log("Load Work:"+ workURL);
        return rp({uri:workURL, json:true}).then(function (workBody) {
            itemURL = itemURL.replace('id.loc.gov', 'mlvlp04.loc.gov:8230') + '.jsonld';
            jsonldReturn[0]["@graph"] = _.concat(jsonldReturn[0]["@graph"],workBody["@graph"]);
            return rp({uri:itemURL, json:true}).then(function (itemBody){
                jsonldReturn[0]["@graph"] = _.concat(jsonldReturn[0]["@graph"], itemBody["@graph"]);
                res.status(200).send(jsonldReturn[0]);
            });
        });
        } else {
        workURL = workURL.replace('id.loc.gov', 'mlvlp04.loc.gov:8230') + '.jsonld';
        jsonldReturn = _.concat(instanceBody, jsonldReturn);
        console.log("Load Work:"+ workURL);
        return rp({uri:workURL, json:true}).then(function (workBody) {
            jsonldReturn[0]["@graph"] = _.concat(jsonldReturn[0]["@graph"], workBody["@graph"]);
            res.status(200).send(jsonldReturn[0]);
        });

        }

    });

//    res.status(200).send(jsonldReturn);

});

var prof_whichrt = router.route('/whichrt');

prof_whichrt.get(function(req,res){
   var request = require('request');
   var uri  = req.query.uri;
   req.pipe(request(uri)).pipe(res);
});

var prof_checkuri = router.route('/checkuri');

prof_checkuri.head(function(req,res){
   var request = require('request');
   var uri  = req.query.uri;
   req.pipe(request.head(uri)).pipe(res);
});

var prof_updateTemplateRefs = router.route ('/updateTemplateRefs');
//not implemented

app.use('/profile-edit/server', router);
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
		'Authorization': 'Basic' + new Buffer(username + ':' + password).toString('base64')
	}
    };
	
    request = http.get(options, function(res){
        res.on('error', function(err) { console.log(err); });
    });
    
    callback(cb);    

  }));

app.post('/login',
  passport.authenticate('basic', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: false })
);
