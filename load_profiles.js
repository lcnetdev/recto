/* This script is a helper tool to load profiles stored at recto/bfe/static/profiles into the verso/config database */

const fs = require('fs');
const request = require('request');
const bfdir = 'bfe/static/profiles/bibframe';
const profiles = fs.readdirSync(bfdir);
for(x = 0; x < profiles.length; x++) {
  let name = profiles[x].replace(/\.json$/,'');
  let ct = 'profile';
  fs.readFile(bfdir + '/' + profiles[x], 'utf8', (err, data) => {
    let pdata = {name : name, configType : ct, json : data};
    request.post({
      // headers: {'content-type' : 'Content-Type: application/json', 'Accept' : 'application/json'},
      url: 'http://localhost:3001/verso/api/configs',
      body: pdata,
      json: true
    }, function(error, response, body){
      if (error) {
        console.error(error);
      } else {
      console.log(body);
      }
    });
  });
}