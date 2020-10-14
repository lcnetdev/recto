'esversion: 8';

const rp = require('request-promise');

const dotenv = require('dotenv');
dotenv.config({path: '../.env'});
const LDPJS_ADDR = process.env.LDPJS_ADDR || 'http://localhost:3000';

var dataattributes = require('../lib/dataattributes');
var args = process.argv.slice(2);

var filter, since, cataloger_id;

if (args[0] !== undefined) since = args[0];
if (args[1] !== undefined) cataloger_id = args[1];

var today = new Date();
if (since === undefined) {
    var since = new Date();
    since.setDate(since.getDate()-7);
} else {
    since = new Date(since);
}

filters = [];
while (today.getTime() > since.getTime()) {
    var weeknext = new Date(since);
    weeknext.setDate(weeknext.getDate()+7);
    
    since = since;
    until = weeknext;

    filter = {
        start: since.toISOString(),
        end: until.toISOString(),
        created_filter: [
            { "$match": { "$and": [ {"versions.content.created": {"$gte": since, "$lte": until} } ] } }
        ],
        modified_filter: [
            { "$match": { "$and": [ {"versions.content.modified": {"$gte": since, "$lte": until} } ] } }
        ],
        created: 0,
        modified: 0,
    };
    
    filters.push(filter);
    
    since = weeknext;
}

function produceOutput() {
    if (processed == to_process) {
        var totalcreated = 0;
        var totalmodified = 0;
        var lines = "Date                    No. Created        No. Modified\n"
        for (var f of filters) {
            totalcreated += f.created;
            totalmodified += f.modified;
            lines += f.start.substr(0, f.start.indexOf('T')) + "\n";
            lines += "  " + f.end.substr(0, f.end.indexOf('T'));
            lines += "              " + f.created + "               " + f.modified + "\n";
        }
        lines += "\n";
        lines += "                         " + totalcreated + "               " + totalmodified + "\n";
        console.log("");
        console.log(lines);
        console.log("");
    }
}

function getStats(f) {
    var url = LDPJS_ADDR + "/ldp/verso/resources";
    var options = {
        method: 'POST',
        uri: url,
        body: f.created_filter,
        headers: {
            'Content-type': "application/x-mongoquery+json"
        },
        json: true // Automatically stringifies the body to JSON
    };
    //console.log(f.created_filter);
    //const rp = require('request-promise');
    //const response = await rp(options);
    //return response;
    rp(options)
    .then(function (createddata) {
        
        if (cataloger_id !== undefined) {
            createddata.results.forEach(function(d){
                var cid = dataattributes.findCatalogerId(d.data.rdf);
                if (cid == cataloger_id) {
                    f.created++;
                }
            });
        } else {
            f.created = createddata.results.length;
        }
        processed++;
        
        var url = LDPJS_ADDR + "/ldp/verso/resources";
        var options = {
            method: 'POST',
            uri: url,
            body: f.modified_filter,
            headers: {
                'Content-type': "application/x-mongoquery+json"
            },
            json: true // Automatically stringifies the body to JSON
        };
        rp(options)
        .then(function (modifieddata) {
            if (cataloger_id !== undefined) {
                modifieddata.results.forEach(function(d){
                    var cid = dataattributes.findCatalogerId(d.data.rdf);
                    if (cid == cataloger_id) {
                        f.modified++;
                    }
                });
            } else {
                f.modified = modifieddata.results.length;
            }
            processed++;
            produceOutput();
        })
        .catch(function (err) {
            console.log(err);
        });
   })
   .catch(function (err) {
        console.log(err);
    });
}

var to_process = filters.length*2;
var processed = 0;
for (i = 0; i < filters.length; i++) { 
    getStats(filters[i]);
}

//console.log(filters);
//process.exit(0);

