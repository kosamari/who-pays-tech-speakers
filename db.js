var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var crypto = require('crypto');
var format = require('util').format;
var MONGO_LOC = 'mongodb://127.0.0.1/whopays';
var log = require('./logger');

module.exports = function() {
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
    });
  });
  return methods;
}