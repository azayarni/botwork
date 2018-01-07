const
    _ = require("lodash"),
    event = require("./event");

module.exports = (config) => {

    let = sessions = {};

    gc();

    return {

        exists(id) {
            return (typeof sessions[id] !== "undefined");
        },

        get(id, key) {

            if (!sessions[id]) {
                sessions[id] = { offset: 0, time: new Date().getTime() };
            }

            return sessions[id][key];
        },

        current(id) {
            if (typeof sessions[id] === "undefined") {
                return sessions[id] = {
                    _id : id,
                    next(cb) {
                        this._next = cb;
                    }
                };
            }

            return sessions[id];
        },

        set(id, key, val) {

            if (!sessions[id]) {
                sessions[id] = { offset: 0, time: new Date().getTime() };
            }

            return sessions[id][key] = val;
        },

        unset(id, key) {
            delete sessions[id][key];
        },

        setTime(id) {
            if (sessions[id]) {
                sessions[id].time = new Date().getTime();
            }
        },

    }

    function gc() {

        // remove inactive chats
        setInterval(() => {

            let now = new Date().getTime();

            let count = _.size(sessions)

            if (count) {
                if (config.verbose) console.log("active sessions", count);
            };

            let deleted = 0;

            _.forEach(sessions, (row, id) => {

                if (row.time < (now - config.lifetime)) {

                    deleted++;

                    delete sessions[id];

                    //event.emit("session_expired", row);

                    if (config.verbose) console.log("session removed", id);
                }
            });

            if (config.verbose) console.log("inactive sessions removed", deleted);

        }, config.interval);
    }
};