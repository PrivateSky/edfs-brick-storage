function FetchBrickTransportStrategy(initialConfig) {
    const url = initialConfig;
    this.send = (data, callback) => {

        fetch(url + "/bricks/put-brick", {
            method: 'PUT',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: data
        }).then(function (response) {
            if (response.status >= 400) {
                throw new Error(`An error occurred ${response.statusText}`);
            }
            return response.json().catch((err) => {
                // This happens when the response is empty
                return {};
            });
        }).then(function (data) {
            callback(null, data)
        }).catch(error => {
            callback(error);
        });

    };

    this.get = (name, callback) => {
        fetch(url + "/bricks/get-brick/" + name, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
        }).then(response => {
            if (response.status >= 400) {
                throw new Error(`An error occurred ${response.statusText}`);
            }
            return response.arrayBuffer();
        }).then(arrayBuffer => {
            let buffer = new Buffer(arrayBuffer.byteLength);
            let view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < buffer.length; ++i) {
                buffer[i] = view[i];
            }

            callback(null, buffer);
        }).catch(error => {
            callback(error);
        });
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
            fetch(url + "/bricks/downloadMultipleBricks" + query, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
            }).then(response => {
                if (response.status >= 400) {
                    throw new Error(`An error occurred ${response.statusText}`);
                }
                return response.arrayBuffer();
            }).then(ab => {

                results.push(ab);

                if(queries.length === 0){
                    return callback(undefined, compactPartialResults(...results));
                }else{
                    return makeRequests();
                }
            }).catch(error => {
                callback(error);
            });
        }

        function compactPartialResults(...arrayBuffers){
            let newSize = 0;

            arrayBuffers.forEach(ab=>{
                newSize += ab.byteLength;
            });

            let newAB = new Uint8Array(newSize);
            let lastSize = 0;
            arrayBuffers.forEach((ab, index)=>{
                newAB.set(new Uint8Array(ab), lastSize);
                lastSize +=ab.byteLength;
            });

            let buffer = new Buffer(newSize);
            let view = new Uint8Array(newAB);
            for (let i = 0; i < buffer.length; ++i) {
                buffer[i] = view[i];
            }

            return buffer;
        }

        makeRequests();

    };

    this.getHashForAlias = (alias, callback) => {
        fetch(url + "/anchor/versions/" + alias, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
        }).then(response => {
            if (response.status >= 400) {
                throw new Error(`An error occurred ${response.statusText}`);
            }
            return response.json().then(data => {
                callback(null, data);
            }).catch(error => {
                callback(error);
            })
        });
    };

    this.attachHashToAlias = (alias, name, lastName, callback) => {
        let anchoringUrl = `${url}/anchor/add/${name}`;
        if (typeof lastName === 'function') {
            callback = lastName;
            lastName = undefined;
        }

        if (lastName !== undefined) {
            anchoringUrl = `${anchoringUrl}/${lastName}`;
        }
        fetch(anchoringUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: alias
        }).then(response => {
            if (response.status >= 400) {
                throw new Error(`An error occurred ${response.statusText}`);
            }
            return response.json().catch((err) => {
                // This happens when the response is empty
                return {};
            });
        }).then(data => {
            callback(null, data);
        }).catch(error => {
            callback(error);
        })
    };

    this.getLocator = () => {
        return url;
    };
}

//TODO:why we use this?
FetchBrickTransportStrategy.prototype.FETCH_BRICK_TRANSPORT_STRATEGY = "FETCH_BRICK_TRANSPORT_STRATEGY";
FetchBrickTransportStrategy.prototype.canHandleEndpoint = (endpoint) => {
    return endpoint.indexOf("http:") === 0 || endpoint.indexOf("https:") === 0;
};


module.exports = FetchBrickTransportStrategy;
