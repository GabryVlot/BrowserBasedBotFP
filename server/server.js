/**********************************************************
 * server.js
 * Express WebServer configuration and initialisation including routes
 *
 * License 2018 Open Source License
 * Written By: Gabry Vlot (https://github.com/GabryVlot)
 * Project: Detecting Web bot Detecting | Fingerprinting (https://github.com/GabryVlot/BrowserBasedBotFP)
 **********************************************************/

const fs = require("fs");
const host = "127.0.0.1";
const port = 8080;
const express = require("express");
const path = require('path');
const settings = JSON.parse(fs.readFileSync('../settings.json', 'utf8'));
const app = express();
const fingerprint = require('./fingerprint');
const dbUtils = require('../db/db-utils.js');
const bodyParser = require('body-parser');
const _ = require('underscore');

// Start DB initialization
dbUtils.initialize();

//Specification of public folder that contains artifact that will need to be send to client
app.use(express.static(path.join(settings.ROOT_PATH, '/public')));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//Configuration to increase size HTTP body
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

//Homepage route
app.get("/index.html", function (request, response) { //root dir
    response.sendFile(settings.ROOT_PATH + '/client/index.html')
});

//Root Redirect index.html
app.get('/', function (req, res) {
    res.redirect('index.html');
});

//Endpoint route for saving fingerprint
app.post('/api/save_fp', function (request, response) {
    try{
        if (!request.body)
            return response.status(500).send({ error: 'Body Request is empty' })

        fingerprint.formatAndPersistFP(request.body, JSON.stringify(request.headers));
        response.sendStatus(200)
    }catch(ex){
        console.log('Exception while trying to save', ex)
        response.sendStatus(400);
    }
});

app.listen(port, host);

