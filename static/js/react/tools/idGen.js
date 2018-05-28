class idGenCls {
    constructor () {
        this.counter = 0;
    }

    id (prefix) {
        let id = (prefix || '' ) + this.counter++;
        return id;
    }
}

let idGenSingleton = new idGenCls();

export {idGenSingleton as idGen}