
const rp = require('request-promise');

const dotenv = require('dotenv');
dotenv.config({path: '../.env'});

var dataattributes = require('../lib/dataattributes');
var args = process.argv.slice(2);

var filter, where, limit, view;

if (args[0] !== undefined) limit = args[0];
if (args[1] !== undefined) where = args[1];

if ( parseInt(limit) > 0 ) {
    filter="filter[limit]=" + limit + "&"
}

if (where) {
    var where_parts = where.split(":");
    var field = where_parts[0];
    var value = where_parts[1];
    
    console.log(field);
    console.log(value);
    
    filter = filter + "filter=%7B%22where%22%3A%20%7B%22" + field + "%22%3A%20%22" + value + "%22%7D%7D";
}

console.log(filter);
var url = process.env.VERSO_PROXY + "/verso/api/bfs?" + filter;
    
var options = {
    method: 'GET',
    uri: url,
    json: true // Takes JSON as string and converts to Object
};

var ids = [];
rp(options)
    .then(function (data) {
        data.forEach(function(d){
            var bfsid = d.id;
            var delurl = process.env.VERSO_PROXY + "/verso/api/bfs/" + bfsid;
            var deloptions = {
                method: 'DELETE',
                uri: delurl,
                resolveWithFullResponse: true
            };
            rp(deloptions)
                .then(function (data) {
                    console.log("Deleted id: " + bfsid + " (" + data.statusCode + ")");
                }) 
                .catch(function (err) {
                    console.log("Error deleting id: " + bfsid);
                    console.log(err);
                });
        });
    })
    .catch(function (err) {
        console.log(err);
    });
    
