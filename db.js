var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var format = require('util').format;
var MONGO_LOC = 'mongodb://127.0.0.1/whopays';
var log = require('./logger');


function init(cb) {
  var methods = {};
  MongoClient.connect(MONGO_LOC, function(err, db) {
    if(err) {
      log.warn(err);
      return;
    }

    db.createCollection('reports', function() {
      var collection = db.collection('reports');

      methods.findall = function(cb){
        collection.find().toArray(function(err,arr){
          cb(err,arr)
        });
      }

      methods.find = function(id, cb){
        try {
          var objectId = new ObjectID(id);
          collection.find(objectId).toArray(function(err, arr) {
            cb(err, arr);
          });
        } catch(e) {
          cb(e, []);
        }
      }
      methods.insert = function(data, cb){
        collection.insert(data, function(err, datum) {
          if (err) {
            log.warn(err)
            return cb(err);
          };
          return cb(err, data, datum);
        });
      }

      methods.update = function(id, data, cb){
        collection.update({_id:id}, data, function(err, d){if(cb){ cb(err,d);}});
      }

      methods.remove = function(id, cb){
        collection.remove({_id:id}, function(err, result) {
          if(cb){ cb();}
        });
      }
      methods.close = function(id, data, cb){
        db.close();
        if(cb){ cb();}
      }

      if(cb){cb();}
    });
  });
  return methods;
}

exports.init = init;
