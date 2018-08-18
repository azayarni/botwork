const
    config = require('./config'),
    request = require('request'),
    event = require('./../../services/event')(),
    _ = require("lodash");

const $this = {

    sendText(recipient_id, text, opts = {}) {
        return $this.sendMessage(
            recipient_id,
            { text: text },
            opts
        )
    },

    sendMenu(recipient_id, text, buttons, opts = {}) {

        let menu = {
            type: "template",
            payload: {
                template_type: "button",
                text: text,
                buttons: []
            }
        };

        _.forEach(buttons, (title, payload) => {

            let btn = title;
            if (typeof title === "string") {

                btn = {
                    type: "postback",
                    title,
                    payload
                };
            }

            menu.payload.buttons.push(btn);
        });

        return $this.sendMessage(
            recipient_id,
            { attachment: menu },
            opts
        );
    },

    sendOptions(recipient_id, text, options = { yes: "Yes, please.", no: "No, thanx" }, opts = {}) {
        if (!options) {
            return $this.sendText(recipient_id, text);
        }

        let buttons = [];

        _.forEach(options, (title, payload) => {

            if (typeof title === "object" && title.data) {
                let tmp = JSON.stringify({ c: payload, d: title.data });
                title = title.title;
                payload = tmp;
            }

            title = String(title);

            let btn = {
                content_type: (payload === "_location" ? "location" : "text"),
                title: title.substr(0, 20),
                payload
            };

            buttons.push(btn);
        });

        return $this.sendMessage(
            recipient_id,
            { quick_replies: buttons, text: text },
            opts
        );
    },

    sendUrlButton(recipient_id, text, title, url, ratio = "full", opts = {}) {

        let btn = {
            "type": "web_url",
            "url": url,
            "title": title,
            "webview_height_ratio": ratio
        };

        let menu = {
            type: "template",
            payload: {
                template_type: "button",
                text: text,
                buttons: [btn]
            }
        };

        return $this.sendMessage(
            recipient_id,
            { attachment: menu },
            opts,
        );
    },

    sendTyping(recipient_id) {

        let data = {
            recipient: {
                id: recipient_id
            },
            sender_action: "typing_on"
        };

        return $this.send(recipient_id, data);
    },

    sendList(recipient_id, elements, first = "compact") {

        let message = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "list",
                    "top_element_style": first,
                    "elements": elements
                }
            }
        };

        return $this.sendMessage(recipient_id, message);
    },

    sendGeneric(recipient_id, elements, aspect_ratio = "horizontal") {

        let message = {
            attachment: {
                type: "template",
                payload: {
                    image_aspect_ratio: aspect_ratio,
                    template_type: "generic",
                    elements: elements
                }
            },
        };
        
        return $this.sendMessage(recipient_id, message);
    },
    
    sendMedia(recipient_id, elements, opts = {}) {
        
        let message = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "media",
                    elements,
                    sharable : true
                }
            },
        };

        return $this.sendMessage(recipient_id, message, opts);
    },

    sendMessage(recipient_id, message, opts = {}) {

        let data = {
            recipient: {
                id: recipient_id
            },
            message: message
        };

        Object.assign(data, opts);

        if (!data.messaging_type) {
            data.messaging_type = "RESPONSE";
        }

        return $this.send(recipient_id, data);
    },

    subscribe() {
        $this.makeRequest("/me/subscribed_apps", {}, "POST")
            .then((res) => {
                if (res.success) console.log("subscribed for messages");
            })
            .catch(console.log);
    },

    send(recipient_id, data, retry = 0) {

        if (config.get("verbose")) console.log("outgoing_message");

        event.emit("messenger_message_out", recipient_id);

        return new Promise((resolve, reject) => {

            request({
                uri: 'https://graph.facebook.com/v2.6/me/messages',
                qs: { access_token: config.get('page_access_token') },
                method: 'POST',
                json: data

            }, (error, response, body) => {

                if (error) {
                    console.error(error);
                    return reject(error);
                }

                if (body.error) {
                    console.error("fb error", recipient_id, body.error.code, body.error.message);

                    if (retry < 1) {
                        return $this.send(recipient_id, data, retry + 1);
                    }

                    // throw inactive user event
                    if (body.error.code == 200) {
                        event.emit("user_blocked", recipient_id);
                    }

                    // resolve even if failed
                    return resolve(false);
                }

                resolve(body);

            });
        });
    },

    getUser(user_id) {
        return new Promise((resolve, reject) => {

            request({
                uri: 'https://graph.facebook.com/v2.6/' + user_id,
                qs: { access_token: config.get('page_access_token') },
                method: 'GET'

            }, (error, response, body) => {

                if (error) {
                    return reject(error);
                }

                if (body.error) {
                    return reject(body.error);
                }

                resolve(JSON.parse(body));

            });
        });
    },

    setStartButton(opts) {
        let params = {
            "setting_type": "call_to_actions",
            "thread_state": "new_thread",
            "call_to_actions": [
                {
                    "payload": opts.button
                }
            ]
        };

        return $this.makeRequest("/me/thread_settings", params, "POST");
    },

    setGreeting(opts) {
        let params = {
            "setting_type": "greeting",
            "greeting": {
                "text": opts.greeting
            }
        };

        return $this.makeRequest("/me/thread_settings", params, "POST");
    },

    setExtensionDomain(domain, action = "add") {
        let params = {
            "setting_type": "domain_whitelisting",
            "domain_action_type": action,
            "whitelisted_domains": [domain]
        };

        return $this.makeRequest("/me/thread_settings", params, "POST");
    },

    setMenu(opts) {

        let params = {
            "persistent_menu": [
                {
                    "locale": "default",
                    call_to_actions: opts.menu
                }
            ]
        };

        return $this.makeRequest("/me/messenger_profile", params, "POST");
    },

    makeRequest(uri, params, method = "GET") {

        return new Promise((resolve, reject) => {

            request({
                uri: 'https://graph.facebook.com/v2.6' + uri,
                qs: { access_token: config.get('page_access_token') },
                method: method,
                json: params

            }, (error, response, body) => {

                if (error) {
                    return reject(error);
                }

                if (body.error) {
                    return reject(body.error);
                }

                resolve(body);

            });
        });
    },

    setupCTA(opts) {
        $this.setStartButton(opts).then(console.log).catch(console.log);
        $this.setMenu(opts).then(console.log).catch(console.log);
        $this.setGreeting(opts).then(console.log).catch(console.log);
    }
};

module.exports = $this;