'esversion: 8';

const rp = require('request-promise');

const dotenv = require('dotenv');
dotenv.config({path: '../.env'});

var dataattributes = require('../lib/dataattributes');
var args = process.argv.slice(2);

var filter, since, view;

if (args[0] !== undefined) since = args[0];

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
    
    since = since.toISOString();
    until = weeknext.toISOString();

    filter = {
        start: since,
        end: until,
        created_filter: "filter[where][and][0][created][gt]=" + since + "&filter[where][and][1][created][lt]=" + until,
        modified_filter: "filter[where][and][0][modified][gt]=" + since + "&filter[where][and][1][modified][lt]=" + until,
        created: 0,
        modified: 0,
    };
    
    filters.push(filter);
    
    since = weeknext;
}

function produceOutput() {
    if (processed == to_process) {
        var lines = "Date                    No. Created        No. Modified\n"
        for (var f of filters) {
            lines += f.start.substr(0, f.start.indexOf('T')) + "\n";
            lines += "  " + f.end.substr(0, f.end.indexOf('T'));
            lines += "              " + f.created + "               " + f.modified + "\n";
        }
        console.log("");
        console.log(lines);
        console.log("");
    }
}

function getStats(f) {
    var url = process.env.VERSO_PROXY + "/verso/api/bfs?" + f.created_filter;
    var options = {
        method: 'GET',
        uri: url,
        json: true // Takes JSON as string and converts to Object
    };
    //const rp = require('request-promise');
    //const response = await rp(options);
    //return response;
    rp(options)
    .then(function (createddata) {
        f.created = createddata.length;
        processed++;
        
        var url = process.env.VERSO_PROXY + "/verso/api/bfs?" + f.modified_filter;
        options.uri = url;
        rp(options)
        .then(function (modifieddata) {
            f.modified = modifieddata.length;
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

