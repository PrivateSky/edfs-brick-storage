function HTTPBrickTransportStrategy(endpoint) {
    require("psk-http-client");

    this.send = (data, callback) => {
        $$.remote.doHttpPost(endpoint + "/bricks", data, (err, brickDigest) => {
            if (err) {
                return callback(err);
            }

            try {
                brickDigest = JSON.parse(brickDigest);
            } catch (e) {
                return callback(e);
            }
            callback(undefined, brickDigest);
        });
    };

    this.get = (name, callback) => {
        $$.remote.doHttpGet(endpoint + "/bricks/" + name, callback);
    };

    const parallelBricksCounter = 50;
    this.getMultipleBricks = (brickHashes, callback) => {
        //console.log("Bricks counter to be requested", brickHashes.length);

        let counter = 0;
        let queries = [];
        while(counter*parallelBricksCounter < brickHashes.length){
            let hashes = brickHashes.slice(counter*parallelBricksCounter, counter*parallelBricksCounter+parallelBricksCounter);
            //console.log("hashes", hashes);
            let q = "?" ;

            hashes.forEach(brickHash => {
                q += "hashes=" + brickHash + "&";
            });

            queries.push(q);
            counter++;
        }

        //console.log("queries.length", queries.length);
        //console.log("brickHashes.length", brickHashes.length);
        let results = [];
        function makeRequests(){
            let query = queries.shift();
            //console.log("query", query);
            $$.remote.doHttpGet(endpoint + "/bricks/downloadMultipleBricks" + query, function(err, result){
                if(err){
                    return callback(err);
                }

                results.push(result);

                if(queries.length === 0){
                    return callback(undefined, results.length === 1 ? result : Buffer.concat(results));
                }else{
                    return makeRequests();
                }
            });
        }

        makeRequests();
    };

    this.getHashForAlias = (alias, callback) => {
        $$.remote.doHttpGet(endpoint + "/anchor/versions/" + alias, (err, hashesList) => {
            if (err) {
                return callback(err)
            }

            callback(undefined, JSON.parse(hashesList.toString()))
        });
    };

    this.attachHashToAlias = (alias, name, lastName, callback) => {
        let anchoringUrl = `${endpoint}/anchor/add/${name}`;
        if (typeof lastName === 'function') {
            callback = lastName;
            lastName = undefined;
        }

        if (lastName !== undefined) {
            anchoringUrl = `${anchoringUrl}/${lastName}`;
        }
        $$.remote.doHttpPost(anchoringUrl, alias, callback);
    };

    this.getLocator = () => {
        return endpoint;
    };
}

HTTPBrickTransportStrategy.prototype.canHandleEndpoint = (endpoint) => {
    return endpoint.indexOf("http:") === 0 || endpoint.indexOf("https:") === 0;
};

module.exports = HTTPBrickTransportStrategy;
