'esversion: 8';

const rp = require('request-promise');

const dotenv = require('dotenv');
dotenv.config({path: '../.env'});
const LDPJS_ADDR = process.env.LDPJS_ADDR || 'http://localhost:3000';

var dataattributes = require('../lib/dataattributes');
var args = process.argv.slice(2);

var filter, since, cataloger_id;

if (args[0] !== undefined) since = args[0];
if (args[1] !== undefined) var serialization = args[1];

if (serialization == "csv") {
    separator = ",";
} else {
    separator = "\t";
}

var until = new Date(); // default to today.
if (since === undefined) {
    var since = new Date();
    since.setDate(since.getDate()-7);
} else {
    if (since.indexOf(':') > 0) {
        var since_parts = since.split(":");
        since = new Date(since_parts[0]);
        until = new Date(since_parts[1]);
    } else {
        since = new Date(since);
    }
}

filters = [];
while (until.getTime() > since.getTime()) {
    var weeknext = new Date(since);
    weeknext.setDate(weeknext.getDate()+7);
    
    since = since;

    filter = {
        start: since.toISOString(),
        end: weeknext.toISOString(),
        created_filter: [
            //{ $match: { $and: [ { created : { $gte: since, $lte: weeknext } } ] } },
            { $match: { $and: [ { "versions.content.created" : { $gte: since, $lte: weeknext } } ] } },
        ],
        modified_filter: [
            //{ $match: { $and: [ { modified : { $gte: since, $lte: weeknext } } ] } },
            { $match: { $and: [ { "versions.content.modified" : { $gte: since, $lte: weeknext } } ] } },
        ],
        created: 0,
        modified: 0,
        catalogers: {},
    };
    
    filters.push(filter);
    
    since = weeknext;
}

function produceOutput() {
    if (processed == to_process) {
        var totalcreated = 0;
        var totalmodified = 0;
        
        var cataloger_handles = [];
        for (var f of filters) {
            for (var c in f.catalogers) {
                cataloger_handles.push(c);
            }
        }
        cataloger_handles = [...new Set(cataloger_handles)];
        cataloger_handles = cataloger_handles.sort();

        var lines = "Date Range";
        for (var c of cataloger_handles) {
            lines += separator + c;
        }
        lines += "\n";
        
        cataloger_totals = {};
        for (var c of cataloger_handles) {
            cataloger_totals[c] = 0;
        }
        for (var f of filters) {
            lines += f.start.substr(0, f.start.indexOf('T'));
            lines += " -> " + f.end.substr(0, f.end.indexOf('T'));
            for (var c of cataloger_handles) {
                if (f.catalogers[c] !== undefined) {
                    lines += separator + f.catalogers[c].created;
                    cataloger_totals[c] += f.catalogers[c].created;
                } else {
                    lines += separator + "0";
                }
            }
            lines += "\n";
        }
        lines += "\nTotals";
        for (var c of cataloger_handles) {
            lines += separator + cataloger_totals[c];
        }
        lines += "\n";
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
        
        createddata.results.forEach(function(d){
            f.created++;
            var cid = dataattributes.findCatalogerId(d.data.rdf);
            if (f.catalogers[cid] !== undefined) {
                f.catalogers[cid].created++;
            } else {
                f.catalogers[cid] = {};
                f.catalogers[cid].created = 1;
                f.catalogers[cid].modified = 0;
            }
            
        });
        console.log(f);
        processed++;
        produceOutput();
        
        /*
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
        */
   })
   .catch(function (err) {
        console.log(err);
    });
}

var to_process = filters.length*1;
var processed = 0;
for (i = 0; i < filters.length; i++) { 
    getStats(filters[i]);
}

//console.log(filters);
//process.exit(0);

