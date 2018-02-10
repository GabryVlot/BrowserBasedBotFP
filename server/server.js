var fs = require("fs");
var host = "127.0.0.1";
var port = 8080;
var express = require("express");
var path = require('path');
var settings = JSON.parse(fs.readFileSync('../settings.json', 'utf8'));
var app = express();
var dbUtils = require('../db/db-utils.js');
var bodyParser = require('body-parser');
const _ = require('underscore');

dbUtils.initialize();

app.use(express.static(path.join(settings.ROOT_PATH, '/public')));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.get("/index.html", function (request, response) { //root dir
    response.sendFile(settings.ROOT_PATH + '/client/index.html')
});

app.get('/', function (req, res) {
    res.redirect('index.html');
});

app.post('/api/save_fp', function (request, response) {
    try{
        if (request.body)
            dbUtils.insertFP(request.body, JSON.stringify(request.headers));
        response.sendStatus(200)
    }catch(ex){
        console.log('Exception saving fingerprint', ex)
        response.sendStatus(400);
    }



});

app.listen(port, host);

