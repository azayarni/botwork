const 
restler = require("restler");

module.exports = (config) => {

    return {

        recode(lat, lng, cb) {

            var query = {
                key: config.gmaps_key,
                latlng: lat + "," + lng,
                //q: opts.query,
            };

            return new Promise((resolve, reject) => {

                restler.get("https://maps.googleapis.com/maps/api/geocode/json", { query: query, parser: restler.parsers.json }).on('complete', (res) => {
                    if (res instanceof Error) {
                        return reject(res);
                    }

                    var loc = {};

                    if (!res.results || !res.results[0]) {
                        let err = new Error("Could not geocode the address");
                        console.log("failed to recode coords", lat, lng);
                        return reject(err);
                    }

                    res.results[0].address_components.forEach((row) => {
                        if (row.types.indexOf("administrative_area_level_1") === 0) {
                            loc.city = row.long_name;
                            loc.city_short = row.short_name;
                        } else if (row.types.indexOf("country") === 0) {
                            loc.country = row.long_name;
                            loc.code = row.short_name;
                        }
                    });

                    resolve(loc);

                });

            });
        },

        geocode(address) {

            let query = {
                key: config.gmaps_key,
                address: address,
                //q: opts.query,
            };

            return new Promise((resolve, reject) => {

                restler.get("https://maps.googleapis.com/maps/api/geocode/json", { query: query, parser: restler.parsers.json }).on('complete', (res) => {
                    if (res instanceof Error) {
                        reject(res);
                    } else {

                        var loc = {};

                        if (!res.results[0]) {
                            console.log("geocoding failed", address);
                            return reject();
                        }

                        res.results[0].address_components.forEach((row) => {
                            if (row.types.indexOf("locality") === 0) {
                                loc.city = row.long_name;
                                loc.city_short = row.short_name;
                            } else if (row.types.indexOf("country") === 0) {
                                loc.country = row.long_name;
                                loc.code = row.short_name;
                            }
                        });

                        resolve(loc);
                    }
                });
            });

        },

    };

};