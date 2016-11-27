const
 path = require("path") 
 _ = require("lodash");

module.exports = (config) => {

    let strings = require(path.join( process.cwd(), 'locales', config.locale) );

    return {

        _(name, params = {}) {

            if (!strings[name]) return name;

            let str = strings[name];

            if (_.size(params) === 0) {
                return str;
            }

            _.each(params, (v, k) => {
                str = str.replace(`{${k}}`, v);
            })

            return str;
        }
    }

}