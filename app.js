var fs = require('fs');
var express = require('express');
var app = express();
var json2csv = require('json2csv');
var _ = require('underscore');
var favicon = require('serve-favicon');
var hbs = require('hbs');

var db = require('./db').init();

var report = require('./report');
var port = 5070;
var async = require('async');

var fields = ['invite_type','talk_type','event_name','event_location','travel_type','ticket_type','fee','currency','travel_assistance','travel_assistance_by_employer','time_off','speaking_slot','speaking_slot_unit','prep_time','prep_time_unit','experience','gender','expertise','speaking_years','event_type','additional_info'];
var fieldNames =['Invite Type','Talk Type','Event Name','Event Location','Travel Type','Ticket Type','Fee','Currency','Travel Assistance','Travel Assistance by Employer','Time Off','Speaking Slot','Speaking Slot Unit','Prep Time','Prep Time Unit','Experience','Gender','Expertise','Speaking Years','Event Type','Additional Info'];
var ga = false;

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
fs.exists(__dirname + '/views/ga.html', function (exists) {
  if(exists){
    ga = true;
    hbs.registerPartial('ga', fs.readFileSync(__dirname + '/views/ga.html', 'utf8'));
  }
});
hbs.registerPartial('footer', fs.readFileSync(__dirname + '/views/footer.html', 'utf8'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart());
app.use(express.static(__dirname + '/public'));
app.listen(port);

app.get('/', function(req, res) {
  res.render('index',{ga:ga});
});

app.post('/submit', function(req, res) {
  for(var i in req.body) {
    req.body[i] = escapeHtml(req.body[i]);
  }
  req.body.report = report.generate(req.body);
  req.body.submitted = submissionDate();
  db.insert(req.body, function(err, data){
    if(err){
      return notfound(req, res);
    }
    res.send({id:data._id});
  });
});

app.get('/data.json', function(req, res) {
  db.findall(function(err, data) {
    res.attachment('data.json');
    res.set('Content-type', 'application/json');
    res.send(_.shuffle(data));
  });
});

app.get('/reports/page/:pageNum(\\d+)', function(req, res) {
  db.findPage(req.params.pageNum, function(err, data) {
    res.json(data);
  });
});

app.get('/autoCompleteData', function(req, res) {
  async.series([
    db.findAllEventNames,
    db.findAllEventLocations
  ], function(err, results) {
    res.json({
      eventNames: results[0],
      eventlocations: results[1]
    });
  });
});

app.get('/data.csv', function(req, res) {
  db.findall(function(err, data) {
    json2csv({data: _.shuffle(data), fields: fields, fieldNames: fieldNames}, function(err, csv) {
      res.attachment('data.csv');
      res.set('Content-type', 'text/csv');
      res.send(csv);
    });
  });
});

app.get('/lab/datatable', function(req, res) {
  db.findall(function(err, data) {
    res.render('datatable', {data:data,ga:ga});
  });
});

app.get('/:id', function(req, res, next) {
  db.find(req.params.id, function(err, data) {
    if(err||data.length===0){ return notfound(req,res);}
    var text = data[0].report.join(' ');
    res.render('submission',{
      _id:data[0]._id,
      ga:ga,
      submitted:data[0].submitted,
      report:text,
      edited_by_admin: data[0].edited_by_admin,
      edit_request_issues:data[0].edit_request_issues,
      tweet:'"'+text.substr(0,56)+'..." - Who pays conference speakers?'
    });
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
