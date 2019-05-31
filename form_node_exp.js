var mysql = require('mysql');
var express = require('express');
var app = express();
var fs = require('fs');
var routes = require('./routings.js');
var sess_route = require('./LoginFiles/session_create.js');
app.use('/start',routes);
app.use('/login',sess_route);
app.set('view engine','pug');
app.set('views','./pugfiles');

app.listen(3203,function(){
	console.log("listening bro!");
})