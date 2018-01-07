const events = require("events");

let emitter = null;

module.exports = (config) => {

    function getEmitter() {
        return emitter ? emitter : emitter = new events.EventEmitter();
    }

    return {

        getEmitter() {
            return getEmitter();
        },

        emit(name, data) {

            getEmitter().emit(name, data);
        }
    }

};