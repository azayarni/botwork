const {Wit, log} = require('node-wit');

module.exports = (config) => {

    const client = new Wit({ accessToken: config.token });

    return {

        detect(message) {
            
            return client.message(message, {})
                .then((data) => {

                    let result = {};

                    if (config.verbose) console.log(JSON.stringify(data));

                    if (data.entities === {}) {
                        return result;
                    }

                    if (data.entities.search_query && data.entities.search_query[0].confidence > config.min_confidance) {
                        result.query = data.entities.search_query[0].value;
                    }
                    if (data.entities.location && data.entities.location[0].confidence > config.min_confidance) {
                        result.location = data.entities.location[0].value;
                    }

                    return result;
                })
                .catch(console.error);
        },
    }

};