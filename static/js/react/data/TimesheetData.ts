
export interface ITimesheetRecord {
    day: string,
    start: string,
    finish: string,
    queue?: string,
    ticket: string,
    desc: string
}

export class TimesheetDataCls {

    parseRawFile(file: string) {
        var line, fileProcessed, desc, record: ITimesheetRecord, fileLinesArr: string[];
        fileProcessed = [];
        fileLinesArr = file.split('\n');
        for (var l = fileLinesArr.length, i = l - 1; i >= 0; i--) {
            desc = void (0);
            record = {
                day: '',
                start: '',
                finish: '',
                queue: '',
                ticket: '',
                desc: ''
            };
            line = fileLinesArr[i].trim();
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
    }
}

let TimesheetDataSingleton = new TimesheetDataCls();

export {TimesheetDataSingleton as TimesheetData};