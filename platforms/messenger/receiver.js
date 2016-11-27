const
    crypto = require('crypto'),
    config = require('./config'),
    Request = require('./request'),
    router = require('./router');

module.exports = (() => {

    return {
        handler(req, res) {

            if (req.method !== "POST") {
                return onVerify(req, res);
            }

            // Assume all went well.
            res.sendStatus(200);

            var data = req.body;

            if (config.get("verbose")) console.log("incomming message");

            onMessage(req.body);
        },

    }
    function onVerify(req, res) {

        if (req.query['hub.mode'] === 'subscribe' &&
            req.query['hub.verify_token'] === config.get('validation_token')) {
            console.log("Validating webhook");
            res.status(200).send(req.query['hub.challenge']);
        } else {
            console.error("Failed validation. Make sure the validation tokens match.");
            res.sendStatus(403);
        }
    }

    function onMessage(data) {

        if (data.object !== 'page') {
            throw new Error(`Wrong message objec type ${data.object}`);
        }

        data.entry.forEach((pageEntry) => {

            pageEntry.messaging.forEach((event) => {

                if (event.optin) {
                    onAuth(event);
                } else if (event.message) {
                    route(event);
                } else if (event.delivery) {
                    route(event);
                } else if (event.postback) {
                    route(event);
                } else if (event.referral) {
                    route(event);
                } else {
                    console.warn("Webhook received unknown messagingEvent: ", event);
                }
            });
        });

    }

    function route(event) {

        if (event.message && event.message.is_echo) {
            return;
        }

        let req = new Request(event);

        router.run(req);
    }

    function onAuth(event) {

        console.log("Received authentication event ", event);
    }

    function onConfirm(event) {
        // do something with it
        console.log("Received confirmation event ", event);
    }

    /*
    * Verify that the callback came from Facebook. Using the App Secret from 
    * the App Dashboard, we can verify the signature that is sent with each 
    * callback in the x-hub-signature field, located in the header.
    *
    * https://developers.facebook.com/docs/graph-api/webhooks#setup
    *
    */
    function verify(req, res, buf) {
        var signature = req.headers["x-hub-signature"];

        if (!signature) {
            // For testing, let's log an error. In production, you should throw an 
            // error.
            console.error("Couldn't validate the signature.");
        } else {
            var elements = signature.split('=');
            var method = elements[0];
            var signatureHash = elements[1];

            var expectedHash = crypto.createHmac('sha1', config.get('app_secret'))
                .update(buf)
                .digest('hex');

            if (signatureHash != expectedHash) {
                throw new Error("Couldn't validate the request signature.");
            }
        }
    }

})(); 