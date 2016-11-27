const event = require('./../../services').event();

module.exports = (() => {

    commands = [{ command: '*', cb: onDefault }];

    pre_hooks = [];
    post_hooks = [];

    return {

        run(req) {

            let proms = [];

            if (!pre_hooks.length) {

                return runCommands(req);
            }

            for (hook of pre_hooks) {
                proms.push(hook(req));
            }

            return Promise.all(proms)
                .then((values) => {
                    runCommands(req);
                })
                .catch(console.log);
        },

        command(command, cb) {
            commands.push({ command: command, cb: cb });
        },

        setDefault(cb) {
            commands[0].cb = cb;
        },

        addPreHook(cb) {
            pre_hooks.push(cb);
        },

        addPostHook(cb) {
            post_hooks.push(cb);
        },
    }

    function runCommands(req) {

        for (command of commands) {

            let coms = command.command;

            if (!Array.isArray(command.command)) {
                coms = [command.command];
            }

            for (com of coms) {

                if (match(req, com)) {

                    return command.cb(req);
                }
            }
        }

        // call next function, if set
        if (req.sess && req.sess._next && typeof req.sess._next === "function") {

            req.sess._next(req);

            return delete req.sess._next;
        }

        /**
        * Call default
        */
        return commands[0].cb(req);
    }

    function match(req, com) {

        if (typeof com === "string" && (com.toLowerCase() === req.payload.toLowerCase())) {

            event.emit("messenger_command", { uid: req.uid, com });
            return true;

        } else if (com instanceof RegExp) {

            let match = req.payload.match(com)

            if (match) {

                req.match = match;

                event.emit("messenger_command", { uid: req.uid, com });

                return true;
            }
        }
    }

    function onDefault() {
        console.error("No callback specified");
    }

})();