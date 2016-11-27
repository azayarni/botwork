const SparkPost = require('sparkpost');

module.exports = (config) => {

    const sp = new SparkPost(config.spark_key);

    return {

        sendText(email, subject, text, opts = {}) {

            let params = {
                content: {
                    from: config.email_from,
                    subject: subject,
                    text: text,
                },
                recipients: [
                    { address: email }
                ]
            };

            return sp.transmissions.send(params);
        },

        sendTmpl(template_id, emails, data, opts = {}) {

            if (!Array.isArray(emails)) {
                emails = [emails];
            }

            let recipients = [];

            emails.forEach((address) => {
                recipients.push({ address });
            });

            let params = {
                content: {
                    from: config.email_from,
                    template_id
                },
                substitution_data: data,
                recipients,
            };

            return sp.transmissions.send(params);
        }
    }

};