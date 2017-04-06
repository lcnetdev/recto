var rdfstore = require('rdfstore')
var fs = require('fs');

rdfstore.create({"communication": {
                     "parsers": {
                       "text/html" :           rdfstore_frontend.rdfaParser,
                       "application/rdf+xml":  rdfstore_frontend.rdfParser
                     },
                   "precedences": ["text/n3", "text/turtle", "application/rdf+xml", "text/html", "application/json"] }
                  }, {
  var rdf = fs.readFileSync('5226.rdf').toString();
  store.load('application/rdf+xml', rdf, function(s,d){
    console.log(s,d);
    store.execute("SELECT * WHERE { ?s ?p ?o } LIMIT 10", function(success, results){
      console.log(success, results);
    });
  });
});

