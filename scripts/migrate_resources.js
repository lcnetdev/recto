const rp = require('request-promise');

const store = require('../../../versoenv/verso/bfpilot.json');

const dotenv = require('dotenv');
dotenv.config();
const appPort = process.env.APPPORT || 3000;

var args = process.argv.slice(2);

var model;

if (args[0] !== undefined) model = args[0];

var x = 0;
if (model == "config" || model == "bf") {
    for (var k in store.models.config) {
        var c = store.models.config[k];
        //console.log(k);
        var options = {
            method: 'POST',
            uri: "http://localhost:" + appPort + "/ldp/verso/configs/",
            body: c,
            headers: {
                'Slug': k,
                'Content-type': "application/json"
            },
            resolveWithFullResponse: true,
            //json: false // Takes JSON as string and converts to Object
        };
        
        if (x < 10) {
            console.log(options.uri + k);
            var r = doRequest(options);
            x++;
        }
    }
} else {
    console.log("Incorrect model designated.");
    process.exit(0); 
}

async function doRequest(options) {
    await rp(options)
        .then(response => {
            //console.log(options);
            console.log("success?");
            console.log(response.statusCode);
        })
        .catch(err => {
            console.log("error?");
            //console.log(err);
            throw err;
        });
}


/*
const fs = require('fs');

fs.readFile('C:\\Users\\kevinford\\work\\versoenv\\verso\\bfpilot.json', (err, store) => {
  if (err) throw err;
  for (var k in store) {
      console.log(k);
  }
});
*/