module.exports = {

    config: {},

    setup(config) {
        this.config = config;
    },

    get(name) {

        if (!this.config.hasOwnProperty(name)) {
            throw new Error(`Config key ${name} not defined.`);
        }

        return this.config[name];
    }


};