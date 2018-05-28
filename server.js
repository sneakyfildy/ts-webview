/* global require */
(function() {
    var ServerAngular = new ServerConstructor('angular');
    ServerAngular.init();

    var ServerReact = new ServerConstructor('react');
    ServerReact.init();

    function ServerConstructor(type) {
        var User, FS, express, app, http, socket, exec, TS_FILEPATH_TEMPLATE, TS_FILEPATH_EXEC, me, TS_FILEPATH_TEMPLATE_REL;
        me = this;

        User = require("./modules/User");
        FS = require("fs");
        express = require("express");
        app = express();
        http = require("http").Server(app);
        socket = require("socket.io")(http);
        exec = require("child_process").exec;

        this.type = type;
        this.port = this.type === 'angular' ? 5555 : 5556;

        this.init = function() {

            TS_FILEPATH_TEMPLATE = "/home/{0}/iponweb/admin/timesheet/{0}";
            TS_FILEPATH_TEMPLATE_REL = "iponweb/admin/timesheet/`whoami`";
            TS_FILEPATH_EXEC = this.makeTsPath("`whoami`");

            User.updateName();

            this.setupPaths();

            socket.on("connection", function(socket) {
                console.log("a user connected");
                socket.on("disconnect", function() {
                    console.log("user disconnected");
                });
                socket.on("chat message", function(msg) {
                    console.log("message: " + msg);
                });
            });

            http.listen(this.port, function() {
                console.log("Server started; port: " + me.port);
            });

            return this;
        };

        this.indexPage = function(req, res) {
            this.type === 'angular'
                ? res.render("index", {title: "TS Ext WebView"})
                : res.render("indexReact", {title: "TS Ext React WebView"});
        };

        this.handleReadFileRequest = function(req, res) {
            FS.readFile(me.makeTsPath(), function(err, data) {
                if (err) {
                    return console.log(err);
                }
                res.end(data);
            });
        };

        this.handleSubmitRequest = function(req, res) {
            var submitCommand = "cd ~ \n cvs -d :ext:`whoami`@timesheets.iponweb.net:/var/cvs ci -m \"updated\" " + TS_FILEPATH_TEMPLATE_REL;
            exec(submitCommand, me.onTimesheetSubmit.bind(me, res));
        };

        this.handleUserRequest = function(request, response) {
            User.getNameByRemoteRequest(response);
        };

        this.handleAddRecordRequest = function(req, res) {
            var data = "";
            req
                .on("data", function(chunk) {
                    data += chunk;
                })
                .on("end", function() {
                    FS.appendFile(me.makeTsPath(), JSON.parse(data).data + "\n", function() {
                        FS.readFile(me.makeTsPath(), function(err, data) {
                            if (err) {
                                return console.log(err);
                            }
                            res.end(data);
                        });
                    });
                });
        };

        this.handleDeleteRecordRequest = function(req, res) {
            var data = "";
            req
                .on("data", function(chunk) {
                    data += chunk;
                })
                .on("end", function() {
                    FS.readFile(me.makeTsPath(), 'utf8', function(err, fileData) {
                        if (err) {
                            return console.log(err);
                        }
                        try {
                            var fileDataArr = fileData.split('\n');
                            var linesExceptFirst = fileDataArr.slice(0, fileDataArr.length - 1).join('\n');
                            FS.writeFile(me.makeTsPath(), linesExceptFirst, function(err) {
                                if (!!err) {
                                    res.status(500).end(err.message);
                                } else {
                                    res.end(JSON.stringify({status: 'success'}));
                                }

                            });
                        } catch (err) {
                            res.status(500).end((err && err.message) || 'Something failed');
                        }
                    });
                });
        };


        this.setupPaths = function(){
            app.set("view engine", "jade");
            app.use(express.static("static"));

            app.post("/add", this.handleAddRecordRequest.bind(this));
            app.get("/read", this.handleReadFileRequest.bind(this));
            app.post("/remove", this.handleDeleteRecordRequest.bind(this));
            app.get("/submit", this.handleSubmitRequest.bind(this));

            app.get("/user", this.handleUserRequest.bind(this));
            app.get("/", this.indexPage.bind(this));
        };

        this.onTimesheetSubmit = function(res, error, stdout, stderr) {
            if (stdout === "" && !stderr) {
                stdout = "nothing";
            }
            if (error || stderr) {
                console.log(error, stderr);
            }
            socket.emit("backend message", "submit");
            res.end(stdout);
        };

        this.makeTsPath = function(userName) {
            return TS_FILEPATH_TEMPLATE.replace(/\{0\}/g, userName || User.name);
        };
    }

})();