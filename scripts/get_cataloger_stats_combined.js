'esversion: 8';

const rp = require('request-promise');

const dotenv = require('dotenv');
dotenv.config({path: '../.env'});
const LDPJS_ADDR = process.env.LDPJS_ADDR || 'http://localhost:3000';
const LDPJS_BFE2_ADDR = process.env.LDPJS_BFE2_ADDR || 'http://localhost:3000';

var dataattributes = require('../lib/dataattributes');
var args = process.argv.slice(2);

var since, metric, serialization;

if (args[0] !== undefined) since = args[0];
if (args[1] !== undefined) metric = args[1];
if (args[2] !== undefined) serialization = args[2];

if (serialization === undefined) {
    serialization = "tsv";
}
if (metric === undefined) {
    // If metric is undefined, so is serialization
    metric = "created";
    serialization = "tsv";
} else if ( metric == "csv" || metric == "tsv" ) {
    // The second parameter was the serialization.
    serialization = metric;
    metric = "created";
}
if (since === undefined) {
    // nothing was set.  'since' will be handled below.
    metric = "created";
    serialization = "tsv";
} else if ( since == "created" || since == "updated" || since == "posted" ) {
    // The first parameter is the metric.  If the second parameter was set to the 
    // serialization, that was handled above.
    metric = since;
    metric = "created";
}

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
        created_filter_bfe1: [
            //{ $match: { $and: [ { created : { $gte: since, $lte: weeknext } } ] } },
            { $match: { $and: [ { "versions.content.created" : { $gte: since, $lte: weeknext } } ] } },
        ],
        modified_filter_bfe1: [
            //{ $match: { $and: [ { modified : { $gte: since, $lte: weeknext } } ] } },
            { $match: { $and: [ { "versions.content.modified" : { $gte: since, $lte: weeknext } } ] } },
        ],
        posted_filter_bfe1: [
            { $match: { $or: [ 
                    { "versions.content.modified" : { $gte: since, $lte: weeknext } },
                    { "versions.content.created" : { $gte: since, $lte: weeknext } }
                ] } },
            { $match: { $and: [ { "versions.content.status" : { $eq: "success" } } ] } },
        ],
        created_filter_bfe2: [
            { $match: { $and: [ { created : { $gte: since, $lte: weeknext } } ] } },
        ],
        modified_filter_bfe2: [
            { $match: { $and: [ { modified : { $gte: since, $lte: weeknext } } ] } },
        ],
        posted_filter_bfe2: [
            { $match: { $or: [ 
                    { modified : { $gte: since, $lte: weeknext } },
                    { created : { $gte: since, $lte: weeknext } }
                ] } },
            { $match: { $and: [ { "index.status" : { $eq: "posted" } } ] } },
        ],
        count: 0,
        catalogers: {},
    };
    
    filters.push(filter);
    
    since = weeknext;
}

function produceOutput() {
    if (processed == to_process) {
        var totals_label = "Created Totals";
        if (metric == "posted") {
            totals_label = "Posted Totals";
        } else if (metric == "modified") {
            totals_label = "Modified Totals";   
        }
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
        
        cataloger_totals = {};
        for (var c of cataloger_handles) {
            cataloger_totals[c] = 0;
        }
        /*
        var lines = "Date Range";
        for (var c of cataloger_handles) {
            lines += separator + c;
        }
        lines += "\n";
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
        */
        var lines = "Cataloger";
        for (var f of filters) {
            lines += separator + f.start.substr(0, f.start.indexOf('T'));
            //lines += " -> " + f.end.substr(0, f.end.indexOf('T'));
        }
        lines += separator + totals_label + "\n";
        for (var c of cataloger_handles) {
            if (c === '') {
                lines += '[empty]';
            } else {
                lines += c;
            }
            for (var f of filters) {
                if (f.catalogers[c] !== undefined) {
                    lines += separator + f.catalogers[c].count;
                    cataloger_totals[c] += f.catalogers[c].count;
                } else {
                    lines += separator + "0";
                }
            }
            lines += separator + cataloger_totals[c];
            lines += "\n";
        }
        lines += totals_label;
        for (var f of filters) {
            lines += separator + f.count;
            totalcreated += f.count;
        }
        lines += separator + totalcreated;
        lines += "\n";
        console.log("");
        console.log(lines);
        console.log("");

    } 
}

function getStats(f) {
    var url_bfe1 = LDPJS_ADDR + "/ldp/verso/resources";
    var url_bfe2 = LDPJS_BFE2_ADDR + "/ldp";
    
    var dofilter_bfe1 = f.created_filter_bfe1;
    var dofilter_bfe2 = f.created_filter_bfe2;
    if (metric == "posted") {
        dofilter_bfe1 = f.posted_filter_bfe1;
        dofilter_bfe2 = f.posted_filter_bfe2;
    } else if (metric == "modified") {
        dofilter_bfe1 = f.modified_filter_bfe1;
        dofilter_bfe2 = f.modified_filter_bfe2;
    }

    var options_bfe1 = {
        method: 'POST',
        uri: url_bfe1,
        body: dofilter_bfe1,
        headers: {
            'Content-type': "application/x-mongoquery+json"
        },
        json: true // Automatically stringifies the body to JSON
    };
    
    var options_bfe2 = {
        method: 'POST',
        uri: url_bfe2,
        body: dofilter_bfe2,
        headers: {
            'Content-type': "application/x-mongoquery+json"
        },
        json: true // Automatically stringifies the body to JSON
    };

    rp(options_bfe1)
    .then(function (resultdata) {
        resultdata.results.forEach(function(d){
            var cid = dataattributes.findCatalogerId(d.data.rdf);
            f.count++;
            if (f.catalogers[cid] !== undefined) {
                f.catalogers[cid].count++;
            } else {
                f.catalogers[cid] = {};
                f.catalogers[cid].count = 1;
            }
        });

        // Let's look bfe2 for this range.
        rp(options_bfe2)
        .then(function (resultdata) {
            resultdata.results.forEach(function(d){
                //console.log(d);
            
                var cid = "";
            
                // This is going to be hacky, but OK.
                const regex = /(lclocal:user>)([A-Za-z0-9\s]+)(<)/g;
                const found = d.data.match(regex);
                if ( found !== null ) {
                    cid = found[0].replace('lclocal:user>', '');
                    cid = cid.replace('<', '');
                }
                
                f.count++;
                if (f.catalogers[cid] !== undefined) {
                    f.catalogers[cid].count++;
                } else {
                    f.catalogers[cid] = {};
                    f.catalogers[cid].count = 1;
                }
            });
        
            processed++;
            produceOutput();
        });
   })
   .catch(function (err) {
        console.log(err);
    });
}

var to_process = filters.length;
var processed = 0;
for (i = 0; i < filters.length; i++) { 
    getStats(filters[i]);
}

//console.log(filters);
//process.exit(0);

