/* global describe, it */
var rdf = require('rdf-ext')
var RdfXmlParser = require('rdf-parser-rdfxml')

var simpleXml = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<rdf:RDF xmlns:e="http://example.org/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
    '<rdf:Description rdf:about="subject">' +
    '<e:predicate>object</e:predicate>' +
    '</rdf:Description>' +
    '</rdf:RDF>';

var rdfXmlParser = function(input, callback) {
    var parser = new rdf.RdfXmlParser();
    parser.parse(input, function doneParsing(dataset) {
        callback(undefined, {'graph': dataset.toArray()});
    });
}

console.log(rdfXmlParser(simpleXml, callback).toString());
