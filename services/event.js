const events = require("events");

module.exports = (config) => {

    let emitter = null;

    function getEmitter() {
        return emitter ? emitter : emitter = new events.EventEmitter();
    }

    return {

        getEmitter() {
            return getEmitter();
        },

        emit(name, data) {
            getEmitter().emit(name, data);;
        }
    }

};