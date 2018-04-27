var tsTool = angular.module('tsTool', []);

tsTool.controller('tsMainController', function ($scope, $sce, $http) {
    var s = $scope;
    s.parser = new Parser(s);
    s.p = s.parser;
    s.ui = new UI(s);
    s.ui.updateData();

    function UI($scope) {
        var me = this;

        this.updateData = function(){
            $http({
                method: 'GET',
                url: '/read'
            }).then(function successCallback(response) {
                window.TS_FILE = response.data;
                $scope.emptyInputWarning = 'No data in the text input';
                $scope.errorDescription = {
                    generalSplitting: 'Couldn\'t parse timesheet line, please check escaping commas and quotes'
                };
                $scope.rawInput = '"2014-03-05",12:35,13:00,uslicer,RT:268314,  More\'\' column polish. Done.';
                $scope.errorsInput = '';
                $scope.parsedInput = [];

                $scope.config = {
                    fields: [
                        {
                            title: 'Date',
                            name: 'day'
                        },
                        {
                            title: 'Start time',
                            name: 'start'
                        },
                        {
                            title: 'Finish time',
                            name: 'finish'
                        },
                        {
                            title: 'Queue ID',
                            name: 'queue'
                        },
                        {
                            title: 'Ticket ID',
                            name: 'ticket'
                        },
                        {
                            title: 'Description',
                            name: 'desc'
                        }
                    ]
                };
                s.records = s.parser.parseFile();
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        };

        this.onSubmitClick = function () {
            this.response = '';
            var responsePromise = $http.get('submit');

            responsePromise.success(function (data, status, headers, config) {
                me.response = data;
            });
            responsePromise.error(function (data, status, headers, config) {
                alert("AJAX failed!");
            });
        };

        this.onAddClick = function () {
            $http({
                method: 'POST',
                url: '/add',
                data: {
                    data: $scope.addInput
                }
            }).then(function successCallback(response) {
                console.log(response);
                s.ui.updateData();
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        };
    }


    function Parser($scope) {
        /**
         *
         * @param {Event} e
         */
        this.onRawInputChange = function (e) {
            console.log(this.rawInput);
            var tmp = [], parsed, errorStr, validatedResult;

            try {
                tmp = this.rawInput.length > 0 ? this.rawInput.split('\n') : [];
            } catch (e) {
                console.warn('Error splitting raw input');
                return;
            }

            parsed = this.parseInput(tmp);

            validatedResult = this.validateParsed(parsed.result);
            this.parsedInput = validatedResult;
            this.errorsInput = '';

            if (parsed.errors.length !== 0) {
                parsed.errors.forEach(function (errorObj, index, iterated) {
                    iterated[index] = 'Line: ' + errorObj.line + '. ' + errorObj.errors.join('<BR>');
                });

                this.errorsInput = $sce.trustAsHtml(parsed.errors.join('\n'));
            }
        };

        /**
         *
         * @param {Array} lines
         * @returns {Object}
         */
        this.parseInput = function (lines) {
            var tsObject = {},
                result = [],
                line,
                lineTmp,
                desc,
                err,
                errorsArr = [];

            for (var i = 0, l = lines.length; i < l; i++) {
                err = {
                    line: i,
                    errors: []
                };
                lineTmp = [];
                line = lines[i].trim().replace(/"[^"]+"/gim, function (quoted) {
                    return quoted.replace(/,/gim, '{%2C}');
                });

                lineTmp = line.split(',');

                if (lineTmp.length !== 6) {
                    err.errors.push(this.errorDescription.generalSplitting
                        + ' Original: <span class="error-original-line">' + line + '</span>');
                }

                if (err.errors.length !== 0) {
                    errorsArr.push(err);
                    continue;
                }

                result.push(lineTmp);
            }


            return {
                result: result,
                errors: errorsArr
            };


        };

        /**
         *
         * @param {Array} lines
         * @returns {Array}
         */
        this.validateParsed = function (lines) {
            var vLines = [];

            lines.forEach(function (item) {
                var vLine = {
                    day: item[0],
                    start: item[1],
                    finish: item[2],
                    queue: item[3],
                    ticket: item[4],
                    desc: item[5]
                };

                vLines.push(vLine);
            });

            return vLines;
        };

        this.parseFile = function () {
            var file, line, fileProcessed, desc, record;
            fileProcessed = [];
            file = window.TS_FILE;
            file = file.split('\n');
            for (var l = file.length, i = l - 1; i >= 0; i--) {
                desc = void(0);
                record = {};
                line = file[i].trim();
                // drop bad lines
                if (line.indexOf('#') === 0 || line === '\n' || line == '') {
                    continue;
                }
                //extract description part (it may be in doublequotes)
                if (line.indexOf('"')) {
                    try {
                        desc = line.match(/".+"$/gim)[0] || '';
                        line = line.replace(',' + desc, '');
                    } catch (err) {
                        debugger;
                    }
                }

                line = line.split(',');
                var isJira;
                if (desc) {
                    // jira ticket will have 4 entries if description was in
                    // quotes and it was cut from a record...
                    isJira = line.length === 4;
                    record.desc = desc;
                } else {
                    // ...and 5 entries if description was not cut from a record
                    isJira = line.length === 5;
                    record.desc = line.pop();
                }
                record.ticket = line.pop();
                record.queue = isJira ? '' : line.pop();
                record.finish = line.pop();
                record.start = line.pop();
                record.day = line.pop();
                fileProcessed.push(record);
            }
            return fileProcessed;
        };
    }
});