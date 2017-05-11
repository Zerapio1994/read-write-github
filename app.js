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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var github_account = 'Jos3Salermo';
var github_password = 'Rouge1234';
var github_repo = 'test';
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
		return res.render('index', {title: 'welcome', body: stringToReplace, sha: sha})
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
