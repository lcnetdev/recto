var _ = require('underscore');

var attributes = {};

attributes.findTitle = function(profile, data){
    var retval;
    var altretval;
    var titleString = 'http://id.loc.gov/ontologies/bibframe/title';
    var mainTitleString = 'http://id.loc.gov/ontologies/bibframe/mainTitle';
    
    // Locate the relevant adminMetadata
    var am_id = ""; 
    _.filter(data, "http://id.loc.gov/ontologies/bflc/profile").forEach(function(x) {
        if (x["http://id.loc.gov/ontologies/bflc/profile"][0]["@value"] == profile) {
            am_id = x["@id"];
        }
    });
    if (am_id != "") {
        _.filter(data, "http://id.loc.gov/ontologies/bibframe/adminMetadata").forEach(function(x) {
            if (
                x["http://id.loc.gov/ontologies/bibframe/adminMetadata"][0]["@id"] == am_id && 
                (
                    x["@type"].includes("http://id.loc.gov/ontologies/bibframe/Work") ||
                    x["@type"].includes("http://id.loc.gov/ontologies/bibframe/Instance")
                )
            ) {
                data.unshift(x);
            }
        });
    }

    if (_.some(data, titleString)) {
        var text = _.find(data, titleString)[titleString];
        if (text !== undefined) {
            _.each(text, function (el) {
                if (el['@id'] !== undefined) {
                    var id = el['@id'];
                    var title = _.find(data, {
                        '@id': id
                    });
                    if (!_.isEmpty(title) && title['@type'].indexOf("http://id.loc.gov/ontologies/bibframe/Title") >= 0) {
                        if (_.has(title, mainTitleString)) { 
                            retval = title[mainTitleString][0]['@value']; 
                        } else if (_.has(title, 'http://www.w3.org/2000/01/rdf-schema#label')) { 
                            retval = title['http://www.w3.org/2000/01/rdf-schema#label'][0]['@value']; 
                        }
                    } else {
                        if (_.has(title, mainTitleString)) altretval = title[mainTitleString][0]['@value'];
                    }
                }
            });
        }
    } else if (_.isEmpty(retval) && _.some(data, 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel')) {
        altretval = _.find(data, 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel')['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'][0]['@value'];
        if (altretval === undefined) { altretval = _.find(data, 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel')['http://www.w3.org/2000/01/rdf-schema#label'][0]['@value']; }
    }

    if (_.isEmpty(retval)) {
        if(!_.isEmpty(altretval))
            retval = altretval;
        else 
            retval = 'No Title';
    }
    
    return retval;
};

attributes.findLccn = function(data){
    var lccnval = 'N/A';
    var lccns = _.filter(data, function (el) {
        if (!_.isEmpty(el['@type'])) {
            if (el['@type'][0].match('^(http|https)://id.loc.gov/ontologies/bibframe/Lccn')) {
                if (_.has(el, ['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'])) {
                    if (!_.isEmpty(el['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['@value'])) { return el['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['@value']; }
                }
            }
        }
    });
    if (!_.isEmpty(lccns)) {
        if (lccns.length === 1) {
            lccnval = lccns[0]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['@value'];
        } else {
            for (var i = 0; i < lccns.length; i++) {
                if (!lccns[i]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['@value'].startsWith('n')){
                    if (!_.some(lccns[i]['http://id.loc.gov/ontologies/bibframe/status'], {'@id': 'http://id.loc.gov/vocabulary/mstatus/cancinv'})) {
                        lccnval = lccns[i]['http://www.w3.org/1999/02/22-rdf-syntax-ns#value'][0]['@value']; 
                    }
                }
            }
        }
    }
    lccnval = lccnval.trim().replace(/\s+/g,'');
    return lccnval;
};


attributes.findContribution = function(data){
    var altretval;
    var contributionval;

    var contributionString = 'http://id.loc.gov/ontologies/bibframe/contribution'
    if (_.some(data, contributionString)) {
      var works = _.where(data,contributionString)
      _.each(works, function(work){
        var contributions = work[contributionString]
        _.each(contributions, function (el) {
          if (el['@id'] !== undefined) {
            var id = el['@id'];
            var contribution = _.find(data, {
              '@id': id
            });
            if (!_.isEmpty(contribution) && !_.isEmpty(contribution['@type'])){
              if(contribution['@type'].indexOf("http://id.loc.gov/ontologies/bflc/PrimaryContribution") >= 0) {
                if(!_.isEmpty(contribution["http://id.loc.gov/ontologies/bibframe/agent"])){
                  var agent = contribution["http://id.loc.gov/ontologies/bibframe/agent"][0]["@id"];
                  if(!_.isEmpty(agent)){
                    if(_.some(data, {"@id": agent}))
                      if(!_.isEmpty( _.find(data, {"@id": agent})["http://www.w3.org/2000/01/rdf-schema#label"])) {
                        contributionval = _.find(data, {"@id": agent})["http://www.w3.org/2000/01/rdf-schema#label"][0]["@value"];
                        return contributionval;
                      }
                  }
                }
              }
            }
          }
        });
      });
    } else if (_.isEmpty(contributionval) && _.some(data, 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel')) {
      altretval = _.find(data, 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel')['http://www.loc.gov/mads/rdf/v1#authoritativeLabel'][0]['@value'];
      if (altretval === undefined) { altretval = _.find(data, 'http://www.loc.gov/mads/rdf/v1#authoritativeLabel')['http://www.w3.org/2000/01/rdf-schema#label'][0]['@value']; }
    }

    if (_.isEmpty(contributionval)){
        // Next three lines were active in decouplement but 
        // commented out in postingchanges.  Keep latter. 
      //if(!_.isEmpty(altretval))
      // contributionval = altretval;
      //else 
      contributionval = '';
    }
    return contributionval;
};

attributes.findCatalogerId = function (data){
    var text = '';
    var mahttp = _.findKey(data, 'http://id.loc.gov/ontologies/bflc/metadataAssigner');
    var mahttps = _.findKey(data, 'https://id.loc.gov/ontologies/bflc/metadataAssigner');
    var cihttp = _.findKey(data, 'http://id.loc.gov/ontologies/bflc/catalogerId');
    var cihttps = _.findKey(data, 'https://id.loc.gov/ontologies/bflc/catalogerId');
    if (mahttps) {
        text = _.pluck(data[mahttps]['https://id.loc.gov/ontologies/bflc/metadataAssigner'], '@value')[0];
    } else if (mahttp) {
        text = _.pluck(data[mahttp]['http://id.loc.gov/ontologies/bflc/metadataAssigner'], '@value')[0];
    } else if (cihttps) {
        text = _.pluck(data[cihttps]['https://id.loc.gov/ontologies/bflc/catalogerId'], '@value')[0];
    } else if (cihttp) {
        text = _.pluck(data[cihttp]['http://id.loc.gov/ontologies/bflc/catalogerId'], '@value')[0];
    }
    return text;
};
  
module.exports = attributes;
