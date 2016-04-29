/* global module */

module.exports = new User().init();

function User(){
    // https://github.com/sindresorhus/username
    var username = require('username');

    this.init = function(){
        this.updateName();
        return this;
    };

    // not very meaningful method, kek
    this.updateName = function(){
         username().then(this.onGetName.bind(this, null));
    };

    this.getName = function(callback){
        username().then(this.onGetName.bind(this, callback));
    };

    this.getNameByRemoteRequest = function(response){
        username().then(this.onGetName.bind(this, this.afterGetNameByRemoteRequest.bind(this, response)));
    };

    this.onGetName = function(callback, result){
        this.name = result ? result : 'Failed to get name';
        if (callback && typeof callback === 'function'){
            callback(this.name);
        }
    };

    this.afterGetNameByRemoteRequest = function(response, name){
        try{
            response.end(name);
        }catch(err){
            console.err('Failed while trying to end the request');
            response.end('');
        }
    };
}