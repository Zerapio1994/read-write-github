var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var GitHubApi = require('github');

var index = require('./routes/index');
var users = require('./routes/users');
var http = require('http')
var app = express();
var formidable = require('formidable');

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'hbs');

var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var github_account = 'Zerapio1994';
var github_password = 'rouge123';
var github_repo = 'read-write-github';
var github_path = 'app.html';
var sha;
var content;
var buffer;
var stringToReplace;




var github = new GitHubApi({
    // optional
    debug: true,
    protocol: "https",
    host: "api.github.com",
    headers: {
        "user-agent": "My-Cool-GitHub-App"
    },
    Promise: require('bluebird'),
    followRedirects: false,
    timeout: 5000
});
github.authenticate({
    type: "basic",
    username: github_account,
    password: github_password
});

app.get('/about', function(req, res){
  res.render('about');
});

var credentials = require('./credentials.js');
app.use(require('cookie-parser')(credentials.cookieSecret));


app.get('/about', function(req, res){
  res.render('about');
});


app.get('/instructions', function(req, res){
  res.render('instructions');
});

app.get('/contact', function(req, res){
  res.render('contact', { csrf: 'CSRF token here' });
});

app.get('/thankyou', function(req, res){
  res.render('thankyou');
});

app.post('/process', function(req, res){
  console.log('Form : ' + req.query.form);
  console.log('CSRF token : ' + req.body._csrf);
  console.log('Email : ' + req.body.email);
  console.log('Question : ' + req.body.ques);
  res.redirect(303,'/thankyou');
});

app.get('/file-upload', function(req, res){
  var now = new Date();
  res.render('file-upload',{
    year: now.getFullYear(),
    month: now.getMonth() });
  });

app.post('/file-upload/:year/:month',
  function(req, res){
 
    // Parse a file that was uploaded
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, file){
      if(err)
        return res.redirect(303, '/error');
      console.log('Received File');
 
      // Output file information
      console.log(file);
      res.redirect( 303, '/thankyou');
  });
});


app.get('/',function(req, res, next){

	github.repos.getContent({
		owner: github_account,
		repo: github_repo,
		path: github_path,
	}, function(error, response){	
		// console.log(err)
		// console.log(response.data)
		content = response.data.content
		sha = response.data.sha
		buffer = new Buffer(content, 'base64').toString('ascii')
		var regex = '<p id="dailyMessage">(.*?)</p>'
		var found = buffer.match(regex)
		stringToReplace  = found[1]
		return res.render('index', {title: 'Application to read-write on GitHub', body: stringToReplace, sha: sha})
	})
})







app.post('/submit', function(req, res, next){
	var message = req.body.message
	var commit = req.body.commit
	var date = new Date
	date = date.toString()
	if (message === "" || commit === ""){
		console.log("failure")
		res.redirect('/?valid=false');
	}else{
		var result = buffer.replace(stringToReplace, message);
		console.log(result)
		// console.log(new Buffer(result).toString('base64'));
		var newContent = new Buffer(result).toString('base64')
		github.repos.updateFile({
			owner: github_account,
			repo: github_repo,
			path: github_path,
			message: date + ': ' + commit ,
			content: newContent,
			sha: sha
		}, function(error, result){	
			console.log(result)
			res.redirect('/?valid=true');

		})
	}
})

//formContactUs
app.post('/submitcontact', function(req, res, next){
  var email = req.body.email
  var question = req.body.question
  var date = new Date
  date = date.toString()
  if (email === "" || question === ""){
    console.log("failure")
    res.redirect('/?valid=false');
  }else{
    var result = buffer.replace(stringToReplace, message);
    console.log(result)
    // console.log(new Buffer(result).toString('base64'));
    var newContent = new Buffer(result).toString('base64')
    github_path = 'contacts.html'
    github.repos.updateFile({
      owner: github_account,
      repo: github_repo,
      path: github_path,
      email: date + ': ' + question ,
      content: newContent,
      sha: sha
    }, function(error, result){ 
      console.log(result)
      res.redirect('/?valid=true');

    })
  }
})



app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
