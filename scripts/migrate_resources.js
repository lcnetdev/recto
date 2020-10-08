const rp = require('request-promise');

const store = require('../../../versoenv/verso/bfpilot.json');

const dotenv = require('dotenv');
dotenv.config();
const appPort = process.env.APPPORT || 3000;

var args = process.argv.slice(2);

var model;

if (args[0] !== undefined) model = args[0];

async function theForLoop(url, data) {
    for (var k in data) {
        var c = data[k];
        var options = {
            method: 'POST',
            uri: url,
            body: c,
            headers: {
                'Slug': k,
                'Content-type': "application/json"
            },
            resolveWithFullResponse: true,
            //json: false // Takes JSON as string and converts to Object
        };
        try {
            let r = await doRequest(options);
            if (r.statusCode === 201) {
                console.log("Success: " + options.uri + options.headers.Slug);
            } else {
                console.log("Something went wrong.");
                console.log(r.statusCode);
            }
        } catch (error) {
            console.error('ERROR:');
            console.error(error);
        }
    }
}

var x = 0;
if (model == "configs" || model == "resources") {
    var m = "config";
    if (model == "resources") {
        m = "bf";
    }
    var url = "http://localhost:" + appPort + "/ldp/verso/" + model + "/";
    var data = store.models[m];
    theForLoop(url, data);
} else {
    console.log("Incorrect model designated.");
    process.exit(0); 
}

async function doRequest(options) {
    return new Promise((resolve, reject) => {
        rp(options)
        .then(response => {
            resolve(response);
        })
        .catch(err => {
            reject(err);
        });
    });
}
