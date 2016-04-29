/* global require */
(function() {
    var Server = new ServerConstructor();

    function ServerConstructor() {
        var User, FS, express, app, http, socket, exec, TS_FILEPATH_TEMPLATE, TS_FILEPATH_EXEC;

        User = require("./modules/User");
        FS = require("fs");
        express = require("express");
        app = express();
        http = require("http").Server(app);
        socket = require("socket.io")(http);
        exec = require("child_process").exec;
        var me = this;

        this.port = 5555;

        this.init = function() {

            TS_FILEPATH_TEMPLATE = "/home/{0}/iponweb/admin/timesheet/{0}";
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
            res.render("index", {title: "TS Ext WebView"});
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
            var submitCommand = "cvs -d :ext:`whoami`@www.iponweb.net:/var/cvs ci -m \"updated\" " + TS_FILEPATH_EXEC;
            exec(submitCommand, me.onTimesheetSubmit.bind(me, res));
        };

        this.handleUserRequest = function(request, response) {
            User.getNameByRemoteRequest(response);
        };

        this.handleAddRecordRequest = function(req, res) {
            var data = "";
            req.on("data", function(chunk) {
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


        this.setupPaths = function(){
            app.set("view engine", "jade");
            app.use(express.static("static"));

            app.post("/add", this.handleAddRecordRequest.bind(this));
            app.get("/read", this.handleReadFileRequest.bind(this));
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
        return this.init();
    }

})();