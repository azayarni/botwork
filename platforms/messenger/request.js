const
    client = require('./client'),
    event = require('./../../services').event();

module.exports = class Request {

    constructor(req) {

        this.raw = req;

        this.parseRequestMessage(req);

        event.emit("messenger_message_in", this);

        this.isYes = this.isYes.bind(this);
        this.isNo = this.isNo.bind(this);
        this.isSkip = this.isSkip.bind(this);
    }

    parseRequestMessage(req) {

        this.uid = req.sender.id;
        this.text = "";

        if (req.postback) {
            this.payload = req.postback.payload;

        if (req.postback.referral) {
            this.payload = "$ref";
            this.data = req.postback.referral;
        }

        } else if (req.referral) {
            this.payload = "$ref";
            this.data = req.referral;
        } else if (req.message.quick_reply) {
            this.payload = req.message.quick_reply.payload;
        } else if (req.message.text) {
            this.payload = req.message.text;
            this.text = req.message.text;
        } else if (req.message.attachments) {
            this.payload = "_" + req.message.attachments[0].type;
            this.is_file = true;
            this["is_" + req.message.attachments[0].type] = true;
            this.data = req.message.attachments[0].payload;
        }

        if (this.payload.indexOf("{") === 0) {
            let payload = JSON.parse(this.payload);
            this.payload = payload.c;
            this.data = payload.d;
        } else {
            this.payload = this.payload.toLowerCase();
        }

        let words = this.payload.split(/[ ,]+/);

        this.yes = this.isYes(words);
        this.no = this.isNo(words);

        this.skip = this.isSkip(words) || this.yes;

    }

    isSkip(words) {

        let answer = false;
        let skip = ["$skip", "skip", "next"];

        skip.forEach((str) => {
            words.forEach((word) => {
                if (word  == str) {
                    answer = true;
                }
            });

        });

        return answer;
    }

    isYes(words) {

        let answer = false;
        let yes = ["$yes", "yes", "yep", "right", "ok", "yup", "fine", "sure", "k", "ah", "aha", "ja", "jup", "true", "kk"];

        yes.forEach((str) => {
            words.forEach((word) => {
                if (word  == str) {
                    answer = true;
                }
            });

        });

        return answer;
    }

    isNo(words) {

        let answer = false;
        let no = ["$no", "no", "nope", "noo", "nah", "false", "wrong", "ne", "nein", "not", "uh-uh"];

        no.forEach((str) => {
            words.forEach((word) => {
                if (word  == str) {
                    answer = true;
                }
            });

        });

        return answer;
    }

    _(name, params) {

        params = params || {first_name : this.sess.user.first_name};

        return Request.i18n._(name, params);
    }

    next(cb) {
        this.sess._next = cb;
    }

    yesOrNo(onYes, onNo, onOther = false) {
        if (this.yes) {

            return onYes(this);
        }

        if (this.no && !onOther) {
            return onNo(this, false);
        }

        onOther(this);

        
    }

    sendText(text) {
        return client.sendText(this.uid, text);
    }

    sendMenu(text, buttons) {

        return client.sendMenu(this.uid, text, buttons);
    }

    sendList(elements, first = "compact") {

        return client.sendList(this.uid, elements, first);
    }

    sendGeneric(elements) {

        return client.sendGeneric(this.uid, elements);
    }

    sendOptions(text, options = { $yes: "Yes, please.", $no: "No, thanx" }) {
        
        return client.sendOptions(this.uid, text, options);
    }

    send(text, btns, opts = {}) {

        if (text.indexOf("_") === 0) {

            text = this._(text.substr(1), opts._params);
        }
        
        return btns ? client.sendOptions(this.uid, text, btns) : client.sendText(this.uid, text);
    }

    sendTyping() {

        return client.sendTyping(this.uid);
    }

    sendMessage(message) {

        return client.sendMessage(this.uid, message);
    }

    getUser() {
        return client.getUser(this.uid);
    }

    static register(name, module) {

        Request[name] = module;
    }
};
