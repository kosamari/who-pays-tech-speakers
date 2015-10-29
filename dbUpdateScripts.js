var async = require('async');
var report = require('./report');
var log = require('./logger');

function generateReport(){
  var db = require('./db').init(function(){
    // re-generate reports
    db.findall(function(err, collection){
      async.eachSeries(collection, function(data, cb){
        data.report = report.generate(data);
        db.update(data._id, data, function(err, result){
          cb();
        });
      }, function done(err, results){
          db.close();
      });
    });
  });
}

function removeDerpConf(){
  var db = require('./db').init(function(){
    // remove DDoS posts
    db.findall(function(err, collection){
      async.eachSeries(collection, function(data, cb){
        if(data.event_name === 'DerpConf' || data.additional_info === "<script>alert('lelz')<script>"||data.additional_info === 'asdf' || data.additional_info === "<script>alert('sup')</script>"){
          db.remove(data._id, function() {
            log.info('removed: ' + JSON.stringify(data));
            cb();
          });
        }else{
          cb();
        }
      }, function done(err, results){
          db.close();
      });
    });
  });
}

function removeById(id){
  var db = require('./db').init(function(){
    // remove specific post
    db.find(id, function(err, data){
      if(err){console.log(err);}
      db.remove(data[0]._id, function(err, res) {
        log.info('removed: ' + JSON.stringify(data));
        db.close();
      });
    });
  });
}

exports.generateReports = generateReport;
exports.removeDerpConf = removeDerpConf;
exports.removeById = removeById;
