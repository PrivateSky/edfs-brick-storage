function EDFSBrickStorage(endpoint) {
    //ensuring that registry is initialized
    require("./brickTransportStrategies/brickTransportStrategiesRegistry");
    const bar = require("bar");
    const brickTransportStrategy = $$.brickTransportStrategiesRegistry.get(endpoint);
    let map;

    this.setBrickMap = function (brickMap) {
        map = brickMap;
    };

    this.putBrick = function (brick, callback) {
        brickTransportStrategy.send(brick.getHash(), brick.getTransformedData(), callback);
    };

    this.getBrick = function (brickHash, callback) {

        brickTransportStrategy.get(brickHash, (err, brickData) => {
            if (err) {
                return callback(err);
            }

            const brick = bar.createBrick();
            brick.setTransformedData(brickData);

            if (brickHash !== brick.getHash()) {
                return callback(Error("The received data is invalid"));
            }
            callback(undefined, brick);
        });
    };

    const BRICK_MAX_SIZE_IN_BYTES = 4;
    this.getMultipleBricks = function (brickHashes, callback) {
        brickTransportStrategy.getMultipleBricks(brickHashes, (err, bricksData) => {
            if (err) {
                return callback(err);
            }
            let bricks = [];

            function parseResponse(response) {
                if (response.length > 0) {
                    let brickSizeBuffer = response.slice(0, BRICK_MAX_SIZE_IN_BYTES);
                    let brickSize = brickSizeBuffer.readUInt32BE();
                    let brickData = response.slice(BRICK_MAX_SIZE_IN_BYTES, brickSize + BRICK_MAX_SIZE_IN_BYTES);
                    const brick = bar.createBrick();
                    brick.setTransformedData(brickData);
                    bricks.push(brick);
                    response = response.slice(brickSize + BRICK_MAX_SIZE_IN_BYTES);
                    return parseResponse(response);
                }
            }

            parseResponse(bricksData);
            callback(undefined, bricks);
        });
    };

    this.deleteBrick = function (brickHash, callback) {
        throw new Error("Not implemented");
    };

    this.getHashForAlias = function (brickId, callback) {
        brickTransportStrategy.getHashForAlias(brickId, callback);
    };

    this.attachHashToAlias = function (alias, value, lastValue, callback) {
        if (typeof lastValue === 'function') {
            callback = lastValue;
            lastValue = undefined;
        }
        brickTransportStrategy.attachHashToAlias(alias, value, lastValue, callback);
    };

    this.putBrickMap = function (brickMap, callback) {
        map = brickMap;
        const brickMapBrick = brickMap.toBrick();
        brickMapBrick.setTransformParameters(brickMap.getTransformParameters());

        let brickId = brickMapBrick.getKey();
        if (!brickId) {
            brickId = brickMapBrick.getHash();
            brickMapBrick.setKey(brickId);
        }

        brickTransportStrategy.getHashForAlias(brickId, (err, hashesList) => {
            if (err) {
                return callback(err);
            }

            if (hashesList.length === 0) {
                __sendBrickMapBrick();
            } else {
                const brickMapHash = hashesList[hashesList.length - 1];
                if (brickMapHash !== brickMapBrick.getHash()) {
                    __sendBrickMapBrick();
                } else {
                    callback();
                }
            }

            function __sendBrickMapBrick() {
                brickTransportStrategy.attachHashToAlias(brickId, brickMapBrick.getHash(), (err) => {
                    if (err) {
                        return callback(err);
                    }

                    brickTransportStrategy.send(brickMapBrick.getHash(), brickMapBrick.getTransformedData(), callback);
                });
            }
        });
    };

    this.getBrickMap = function (mapDigest, callback) {
        if (typeof mapDigest === "function") {
            callback = mapDigest;
            mapDigest = undefined;
        }

        if (map) {
            return callback(undefined, map);
        }

        if (typeof mapDigest === "undefined") {
            return callback(undefined, bar.createBrickMap());
        }

        brickTransportStrategy.getHashForAlias(mapDigest, (err, hashesList) => {
            if (err) {
                return callback(err);
            }

            let brickMapId;
            if (hashesList.length === 0) {
                brickMapId = mapDigest;
            } else {
                brickMapId = hashesList[hashesList.length - 1];
            }
            brickTransportStrategy.get(brickMapId, (err, brickMapData) => {
                if (err) {
                    return callback(undefined, bar.createBrickMap());
                }

                const mapBrick = bar.createBrick();
                mapBrick.setTransformedData(brickMapData);
                if (brickMapId !== mapBrick.getHash()) {
                    return callback(Error("Invalid data received"));
                }
                map = bar.createBrickMap(mapBrick);
                callback(undefined, map);
            });
        });
    };
}

module.exports = EDFSBrickStorage;

