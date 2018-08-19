const 
ua = require('universal-analytics');

module.exports = (config) => {

    return {

        event(id, category, action, label) {

            //if (!config.track) return;

            console.log(id, category, action, label)

            var visitor = ua(config.ga_id, id, { strictCidFormat: false });

            if (label) visitor.event(category, action, label).send();
            else visitor.event(category, action).send();
        },
    }

};