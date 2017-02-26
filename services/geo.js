const 
restler = require("restler");

module.exports = (config) => {

    return {

        recode(lat, lng) {

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
                        return reject(err);
                    }

                    for (row of res.results) {
                        if (row.types.indexOf("locality") === 0) {
                            loc.city = row.address_components[0].long_name;
                            loc.city_id = row.place_id;
                        } else if (row.types.indexOf("country") === 0) {
                            loc.country = row.address_components[0].long_name;
                            loc.code = row.address_components[0].short_name;
                        }
                    }

                    loc.point = {lat, lng};

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
                            let err = new Error("Could not geocode the address");
                            return reject(err);
                        }

                        //console.log(res.results[0].address_components);

                        loc.point = res.results[0].geometry.location;
                        loc.city_id = res.results[0].place_id;

                        for (row of res.results[0].address_components) {

                            console.log(row)

                            if (row.types.indexOf("locality") != -1) {
                                loc.city = row.long_name;
                            } else if (row.types.indexOf("country") === 0) {
                                loc.country = row.long_name;
                                loc.code = row.short_name;
                            }
                        }

                        resolve(loc);
                    }
                });
            });

        },

    };

};