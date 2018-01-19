
var fs = require('fs'),
$rdf = require('rdflib');

var rdfData=fs.readFileSync(__dirname+'/5226.rdf').toString();

RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
RDFS = $rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#');
BF = $rdf.Namespace('http://id.loc.gov/ontologies/bibframe/');
BFLC = $rdf.Namespace('http://id.loc.gov/ontologies/bflc/');
MADS = $rdf.Namespace('http://www.loc.gov/mads/rdf/v1#');

var store=$rdf.graph();
var contentType='application/rdf+xml';
var baseUrl="http://id.loc.gov";

try{
    $rdf.parse(rdfData,store,baseUrl,contentType);

//    var stms = store.statementsMatching(undefined, undefined , undefined);
//    for (var i=0; i<stms.length;i++) {
//        var stm = stms[i]
//        console.log(stm) // the WebID of a friend
    console.log($rdf.serialize(undefined, store, baseUrl, 'application/ld+json'));

//    }
} catch(err){
    console.log(err);
}
