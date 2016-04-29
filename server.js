/* global require */
(function(){
    var test = require('./testmod');
    var User = require('./server/User');
    var fs = require('fs');

    var express = require('express');
    var app = express();
    var http = require('http').Server(app);
    var io = require('socket.io')(http);
    var util = require('util');
    var exec = require('child_process').exec;
    function puts(res, error, stdout, stderr) {
        if (stdout === '' && !stderr) {
            stdout = 'nothing';
        }
        if (error || stderr){
            console.log(error, stderr);
        }
        io.emit('backend message', 'submit');
        res.end(stdout);
    }

    var TS_FILEPATH_EXEC, TS_FILEPATH_TEMPLATE;
    TS_FILEPATH_TEMPLATE = 'iponweb/admin/timesheet/{0}';
    TS_FILEPATH_EXEC = makeTsPath('`whoami`');
    function makeTsPath(userName){
        return TS_FILEPATH_TEMPLATE.replace('{0}', userName || User.name);
    }
    User.updateName();

    app.set('view engine', 'jade');
    app.use(express.static('static'));

    app.get('/read', function (req, res) {
        fs.readFile(makeTsPath(), function (err, data) {
            if (err) {
                return console.log(err);
            }
            res.end(data);
        });
    });

    app.get('/submit', function (req, res) {
        exec("cd ~ \n cvs -d :ext:`whoami`@www.iponweb.net:/var/cvs ci -m \"updated\" " + TS_FILEPATH_EXEC, puts.bind(this, res));
    });
    app.get('/user', function (request, response) {
        User.getNameByRemoteRequest(response);
    });
    app.post('/add', function (req, res) {
        var data = '';
        req.on('data', function (chunk) {
            data += chunk;
        })
        .on('end', function () {
            fs.appendFile(makeTsPath(), JSON.parse(data).data + '\n', function(){
                fs.readFile(makeTsPath(), function (err, data) {
                    if (err) {
                        return console.log(err);
                    }
                    res.end(data);
                });
            });

        });

    });
    app.get('/', function (req, res) {
        res.render('index', {title: 'TS Ext WebView', message: 'Hello there!'});
    });

    io.on('connection', function (socket) {
        console.log('a user connected');
        socket.on('disconnect', function () {
            console.log('user disconnected');
        });
        socket.on('chat message', function (msg) {
            console.log('message: ' + msg);
        });
    });

    http.listen(5555, function () {
        console.log('Example app listening on port 5555!');
    });
})();