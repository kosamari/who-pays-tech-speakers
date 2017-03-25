var fs = require('fs');
var express = require('express');
var app = express();
var json2csv = require('json2csv');
var _ = require('underscore');
var favicon = require('serve-favicon');
var hbs = require('hbs');

var report = require('./report');
var port = 5070;

var admin = require('firebase-admin')
var serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://whopays-522bd.firebaseio.com'
})
var db = admin.database()

var fields = ['invite_type','talk_type','event_name','event_location','travel_type','ticket_type','fee','currency','travel_assistance','travel_assistance_by_employer','time_off','speaking_slot','speaking_slot_unit','prep_time','prep_time_unit','experience','gender','expertise','speaking_years','event_type','additional_info'];
var fieldNames =['Invite Type','Talk Type','Event Name','Event Location','Travel Type','Ticket Type','Fee','Currency','Travel Assistance','Travel Assistance by Employer','Time Off','Speaking Slot','Speaking Slot Unit','Prep Time','Prep Time Unit','Experience','Gender','Expertise','Speaking Years','Event Type','Additional Info'];

var postsPerPage = 5;

function submissionDate(){
  var monthNames = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
  var now = new Date();
  var date = now.getDate()<10? 'early': now.getDate()>20 ? 'late': 'mid';
  var month = monthNames[now.getMonth()];
  var year = now.getFullYear();
  return date+' '+month +' '+ year;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/*
* express server setup
*/
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(favicon(__dirname + '/public/img/favicon.ico'));
hbs.registerPartial('ga', fs.readFileSync(__dirname + '/views/ga.html', 'utf8'));
hbs.registerPartial('footer', fs.readFileSync(__dirname + '/views/footer.html', 'utf8'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart());
app.use(express.static(__dirname + '/public'));
app.listen(port);

app.get('/', function(req, res) {
  db.ref('posts').once('value', function (snapshot) {
    var data = _.toArray(snapshot.val())
    res.render('index', {posts: data.slice(0, postsPerPage), length: data.length});
  }, function () {
    res.render('index', {});
  })
});

app.post('/submit', function(req, res) {
  if (req.body.event_name) {
    db.ref('events/'+req.body.event_name).set(true)
  }

  if (req.body.event_location) {
    db.ref('locations/'+req.body.event_location).set(true)
  }

  var ref = db.ref('posts').push()
  req.body._id = ref.key

  for(var i in req.body) {
    req.body[i] = escapeHtml(req.body[i]);
  }
  req.body.report = report.generate(req.body);
  req.body.submitted = submissionDate();

  ref.set(req.body).then(
    res.send( {id: ref.key} )
  ).catch(
    notfound(req, res)
  );

});

app.get('/data.json', function(req, res) {
  db.ref('posts').once('value', function (snapshot) {
    var data = snapshot.val()
    res.attachment('data.json');
    res.set('Content-type', 'application/json');
    res.send(_.shuffle(data));
  }, function () {
    notfound(req, res);
  })
});

app.get('/reports/page/:pageNum(\\d+)', function(req, res) {
  db.ref('posts').once('value', function (snapshot) {
    var data = _.toArray(snapshot.val())
    var start = postsPerPage * (req.params.pageNum - 1)
    var end = start + postsPerPage
    var json = {
      reports: data.slice(start, end),
      count: data.length,
      more: req.params.pageNum < Math.ceil(data.length / postsPerPage)
    }
    res.json(json);
  }, function () {
    notfound(req, res);
  })
});

app.get('/autoCompleteData', function(req, res) {
  db.ref('events').once('value', function (snapshot) {
    var events = Object.keys(snapshot.val());
    db.ref('locations').once('value', function (snapshot) {
      var locations = Object.keys(snapshot.val());
      res.json({
        eventNames: events,
        eventLocations: locations
      });
    });
  });
});

app.get('/data.csv', function(req, res) {
  db.ref('posts').once('value', function (snapshot) {
    var data = snapshot.val()
    json2csv({data: _.shuffle(data), fields: fields, fieldNames: fieldNames}, function(err, csv) {
      res.attachment('data.csv');
      res.set('Content-type', 'text/csv');
      res.send(csv);
    });
  }, function () {
    notfound(req, res);
  })
});

app.get('/lab/datatable', function(req, res) {
  db.ref('posts').once('value', function (snapshot) {
    var data = snapshot.val()
    res.render('datatable', {data:data});
  }, function () {
    notfound(req, res);
  })
});

app.get('/:id', function(req, res, next) {
  db.ref('posts/' + req.params.id).once('value', function (snapshot) {
    var data = snapshot.val()
    if(!data || data.length===0){ return notfound(req, res);}
    var text = data.report.join(' ');
    res.render('submission',{
      _id:data._id,
      submitted:data.submitted,
      report:text,
      edited_by_admin: data.edited_by_admin,
      edit_request_issues:data.edit_request_issues,
      tweet:'"'+text.substr(0,56)+'..." - Who pays conference speakers?'
    });
  }, function () {
    notfound(req, res);
  });
});

app.use(notfound);

function notfound (req, res, next){
  res.status(404);
  // respond with html page
  if (req.accepts('html')) return res.render('404');

  // respond with json
  if (req.accepts('json')) return res.send({ error: 'Not found' });

  // default to plain-text. send()
  return res.type('txt').send('Page Not found');
}
