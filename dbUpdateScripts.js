var async = require('async');
var report = require('./report');
var log = require('./logger');

function generateReports(){
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

function generateOneReport(id){
  var db = require('./db').init(function(){
  // re-generate reports
  db.find(id, function(err, data){
      if(err || data.length===0){ return;}
      data[0].report = report.generate(data[0]);
      db.update(data[0]._id, data[0], function(err, result){
        db.close();
      });
    });
  });
}

function updateItem(id, key, val, reason, issueID){
  if(!id||!key||!val||!reason){ console.log('please pass all 4 arg'); return;}
  var db = require('./db').init(function(){
    db.find(id, function(err, data){
      if(err || data.length===0){ return;}
      data[0][key] = val;
      data[0].edited_by_admin = true;
      if(!data[0].edit_request_issues){
        data[0].edit_request_issues = [];
      }
      data[0].edit_request_issues.push(issueID);
      if(!data[0].edit_notes){
        data[0].edit_notes = [];
      }
      data[0].edit_notes.push({
        timestam: new Date(),
        key:key,
        value:val,
        reason: reason
      });
      db.update(data[0]._id, data[0], function(err, result){
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
      if(err || data.length===0){ return;}
      db.remove(data[0]._id, function(err, res) {
        log.info('removed: ' + JSON.stringify(data));
        db.close();
      });
    });
  });
}

exports.generateReports = generateReports;
exports.generateOneReport = generateOneReport;
exports.updateItem = updateItem;
exports.removeDerpConf = removeDerpConf;
exports.removeById = removeById;
