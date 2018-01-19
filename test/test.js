var rdfstore = require('rdfstore')
var rdf = require('rdf-ext');
var simple = require('simplerdf');
var $rdf = require('rdflib');
var fs = require('fs');

FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
XSD  = $rdf.Namespace('http://www.w3.org/2001/XMLSchema#');
RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
RDFS = $rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#');
BF = $rdf.Namespace('http://id.loc.gov/ontologies/bibframe/');
BFLC = $rdf.Namespace('http://id.loc.gov/ontologies/bflc/');
MADS = $rdf.Namespace('http://www.loc.gov/mads/rdf/v1#');

// - create an empty store
var kb = new $rdf.IndexedFormula();

// - load RDF file
fs.readFile('5226.rdf', function (err, data) {
if (err) { /* error handling */ }

// NOTE: to get rdflib.js' RDF/XML parser to work with node.js,
// see https://github.com/linkeddata/rdflib.js/issues/47

// - parse RDF/XML file
$rdf.parse(data.toString(), kb, '5226.rdf', 'application/rdf+xml', function(err, kb) {
    if (err) { /* error handling */ }

     console.log(kb.toString());

//     str = $rdf.serialize(data, kb, data.uri, 'text/n3')
//     console.log(str)

   }); 	

});

