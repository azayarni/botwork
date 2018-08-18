const 
restler = require("restler");

module.exports = (config) => {

    return {

        queries : [],
        cache : [],
        rcache : {},

        recode(lat, lng) {

            var query = {
                key: config.gmaps_key,
                latlng: lat + "," + lng
            };

            let cache_key = query.latlng.replace(".", "-").replace(",", "-");

            if (this.rcache[cache_key]) {
                console.log("re geo cache")
                return Promise.resolve(this.rcache[cache_key]);
            }

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

                    this.rcache[cache_key] = loc;

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

            let cached_idx = this.queries.indexOf(address);

            if (cached_idx !== -1) {
                console.log("geo cache");
                return Promise.resolve(this.cache[cached_idx]);
            }

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

                            if (row.types.indexOf("locality") != -1) {
                                loc.city = row.long_name;
                            } else if (row.types.indexOf("country") === 0) {
                                loc.country = row.long_name;
                                loc.code = row.short_name;
                            }
                        }

                        this.cache.push(loc);
                        this.queries.push(address);

                        resolve(loc);
                    }
                });
            });

        },

    };

};