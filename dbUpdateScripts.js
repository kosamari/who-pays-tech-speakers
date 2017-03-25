var _ = require('underscore')
var report = require('./report')
var admin = require('firebase-admin')
var serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://whopays-522bd.firebaseio.com'
})
var db = admin.database()

function importFromMongoDump (filepath) {
  var data = require(filepath)
  data.forEach(function (d) {
    db.ref('posts/' + d._id).set(d)
  })
  db.ref('posts').once('value', function (snapshot) {
    var data = _.toArray(snapshot.val())
    db.ref('events').set(_.uniq(_.pluck(data, 'event_name')))
    db.ref('locations').set(_.uniq(_.pluck(data, 'event_location')))
  })
}

function generateReports () {
  var ref = db.ref('posts')
  ref.once('value', function (snapshot) {
    var data = snapshot.val()
    for (var i in data) {
      data[i].report = report.generate(data[i])
      ref.child(i).set(data[i])
    }
  }, function () {
    console.log('[generateReports] : Error getting posts')
  })
}

function generateOneReport (id) {
  var ref = db.ref('posts/' + id)
  ref.once('value', function (snapshot) {
    var data = snapshot.val()
    console.log(data)
    console.log(report.generate(data))
    data.report = report.generate(data)
    ref.set(data)
  }, function () {
    console.log('[generateOneReport] : Error getting post')
  })
}

function updateItem (id, key, val, reason, issueID) {
  if (!id || !key || !val || !reason || !issueID) { console.log('please pass all 4 arg'); return }

  var ref = db.ref('posts/' + id)
  ref.once('value', function (snapshot) {
    var data = snapshot.val()
    data[key] = val
    data.edited_by_admin = true

    if (!data.edit_request_issues) {
      data.edit_request_issues = []
    }
    data.edit_request_issues.push(issueID)
    if (!data.edit_notes) {
      data.edit_notes = []
    }
    data.edit_notes.push({
      timestamp: new Date().toISOString(),
      key: key,
      value: val,
      reason: reason,
      issueID: issueID
    })
    ref.set(data)
  }, function () {
    console.log('[generateOneReport] : Error getting post')
  })
}

function removeById (id) {
  db.ref('posts').child(id).remove()
}

exports.importFromMongoDump = importFromMongoDump
exports.generateReports = generateReports
exports.generateOneReport = generateOneReport
exports.updateItem = updateItem
exports.removeById = removeById
