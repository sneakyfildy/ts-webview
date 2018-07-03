import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import './main.css';

import {idGen} from './tools';
import {TimesheetData} from './data';

class TimesheetRecord extends React.Component {
    render (){
        return (
            <tr>
                <td className="date">{this.props.record.day}</td>
                <td className="">{this.props.record.start}</td>
                <td className="">{this.props.record.finish}</td>
                <td className="">{this.props.record.queue}</td>
                <td className="">{this.props.record.ticket}</td>
                <td className="description">{this.props.record.desc}</td>
            </tr>
            );
    }
}


class TimesheetTable extends React.Component {
    constructor (props){
        super(props);
    }

    renderData (startIndex, endIndex){
        var row = [];
        var i = startIndex || 0;
        while (i < (endIndex || this.props.records.length)) {
            row.push(this.renderRecord(this.props.records[i]));
            i++;
        }
        return row;
    }

    renderRecord (record){
        return <TimesheetRecord record={record} key={idGen.id('timesheet-record-')}/>;
    }
    
    render (){
        const status = 'Next player: X';

        return (
            <table className="ts-table" border="1">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Start time</th>
                        <th>Finish time</th>
                        <th>Queue ID</th>
                        <th>Ticket ID</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {this.renderData()}
                </tbody>
            </table>
            );
    }
}

class TimesheetControls extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            inputValue: ''
        }
    }

    onSubmitClick () {
        this.props.afterSubmitClick();
    }

    onAddClick (e) {
        this.props.afterAddClick(this.state.inputValue);
    }

    onRemoveLastLineClick () {
        this.props.afterRemoveLastLineClick();
    }

    handleChange (e) {
        this.setState({ inputValue: e.target.value });
    }

    render (){
        return (
            <div>
                <button className="btn btn-default" onClick={() => this.onSubmitClick()}>CVS Submit</button>
                <span>{this.props.submitResponse}</span>
                <br/>
                <button className="btn btn-default" onClick={() => this.onAddClick()}>Add</button>
                <button className="btn btn-default" onClick={() => this.onRemoveLastLineClick()}>Remove last line</button>
                <input className="add-input" type="text" value={this.state.inputValue} onChange={this.handleChange.bind(this)} />
            </div>
        );
    }
}

class TimesheetApp extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            records: [],
            inputValue: '',
            submitResponse: ''
        };
    }

    afterAddClick (inputValue) {
        axios.post('/add', {data: inputValue})
            .then(res => {
                this.getRecords();
            });
    }

    afterRemoveLastLineClick () {
        axios.post('/remove')
            .then(res => {
                this.getRecords();
            });
    }

    afterSubmitClick () {
        axios.get('/submit')
            .then(res => {
                this.setState({
                    submitResponse: res.data
                })
            });
    }

    componentDidMount (){
        this.getRecords();
    }

    componentWillUnmount (){
    }

    getRecords () {
        axios.get('/read')
            .then(res => {
                let records = TimesheetData.parseRawFile(res.data);
                records = records.slice(0, 20);
                this.setState({records: records});
            });
    }

    render (){
        return (
            <div>
                <TimesheetControls
                    afterAddClick={(text) => this.afterAddClick(text)}
                    afterRemoveLastLineClick={() => this.afterRemoveLastLineClick()}
                    afterSubmitClick={() => this.afterSubmitClick()}
                    submitResponse={this.state.submitResponse}/>
                <TimesheetTable records={this.state.records}/>
            </div>
        );
    }
}

// ========================================

ReactDOM.render(
    <TimesheetApp />,
    document.getElementById('index')
);
