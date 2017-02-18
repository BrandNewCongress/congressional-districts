const express = require('express');
const app = express();
const base = require('airtable').base('appvaAepP28NyUecP');

var candidates = {};
var districts = {};

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

var getOrLoadNominations = function(done) {
  if(Object.keys(candidates).length > 0) {
    done();
  } else {
    base('Nominations').select({
      view: 'Main View'
    }).eachPage(function(records, fetchNextPage) {
      records.forEach(function(record) {
        candidates[record.id] = record.fields;
      });
      fetchNextPage();
    }, function(err) {
      if (err) { console.error(err); return; }

      done();
    });
  }
};

var getOrLoadDistricts = function(done) {
  if(Object.keys(districts).length > 0) {
    done();
  } else {

    base('Congressional Districts').select({
      view: 'Main View'
    }).eachPage(function(records, fetchNextPage) {
      records.forEach(function(record) {
        nominations = record.get('Nominations') || [];
        districts[record.get('ID')] = {
          nominations: nominations.map(function(id) {
            return candidates[id];
          })
        };
      });
      fetchNextPage();
    }, function(err) {
      if (err) { console.error(err); return; }

      done();
    });
  }
};

app.get('/api/candidates', function(req, res) {
  getOrLoadNominations(function() {
    getOrLoadDistricts(function() {
      res.send(JSON.stringify(districts));
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
