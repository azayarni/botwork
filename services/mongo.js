const
    mongoose = require("mongoose");

module.exports = (config) => {

    return {
        connect() {

            let url = process.env.MONGO_URL || config.host;

            mongoose.connect(url);
            mongoose.Promise = global.Promise;

            const db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', function () {

                console.log("connected to mongo");
            });
        }
    }
}