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
//        this.state = {
//            data: []
//        };
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
        console.log(this.props.inputValue);
    }

    onAddClick (e) {
        this.props.afterAddClick(this.state.inputValue);
    }


    handleChange (e) {
        this.setState({ inputValue: e.target.value });

        //this.props.inputValue = e.target.value;
    }

    render (){
        return (
            <div>
                <button className="btn btn-default" onClick={() => this.onSubmitClick()}>CVS Submit</button>
                <span>response ui.response</span>
                <br/>
                <button className="btn btn-default" onClick={() => this.onAddClick()}>Add</button>
                <input className="add-input" type="text" value={this.state.inputValue} onChange={this.handleChange.bind(this)} />
            </div>
        );
    }
}

TimesheetControls.propTypes = {
  afterAddClick: PropTypes.func
};

class TimesheetApp extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            records: [],
            inputValue: ''
        };
    }

    afterAddClick (inputValue) {
        console.log('add: ' + inputValue);
    }

    componentDidMount (){
        axios.get('/read')
            .then(res => {
                let records = TimesheetData.parseRawFile(res.data);
                this.setState({records: records});
            });
    }

    componentWillUnmount (){
    }

    handleChange (e) {debugger;
        this.setState({ inputValue: e.target.value });
    }

    render (){
        return (
            <div>
                <TimesheetControls afterAddClick={(text) => this.afterAddClick(text)}/>
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
