function EDFSBrickStorage(endpoint) {

    const bar = require("bar");
    const brickTransportStrategy = $$.brickTransportStrategiesRegistry.get(endpoint);
    let map;

    this.setBarMap = function (barMap) {
        map = barMap;
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

    this.attachHashToAlias = function (alias, value, callback) {
        brickTransportStrategy.attachHashToAlias(alias, value, callback);
    };

    this.putBarMap = function (barMap, callback) {
        map = barMap;
        const barMapBrick = barMap.toBrick();
        barMapBrick.setTransformParameters(barMap.getTransformParameters());

        let brickId = barMapBrick.getKey();
        if (!brickId) {
            brickId = barMapBrick.getHash();
            barMapBrick.setKey(brickId);
        }

        brickTransportStrategy.getHashForAlias(brickId, (err, hashesList) => {
            if (err) {
                return callback(err);
            }

            if (hashesList.length === 0) {
                __sendBarMapBrick();
            } else {
                const barMapHash = hashesList[hashesList.length - 1];
                if (barMapHash !== barMapBrick.getHash()) {
                    __sendBarMapBrick();
                } else {
                    callback();
                }
            }

            function __sendBarMapBrick() {
                brickTransportStrategy.attachHashToAlias(brickId, barMapBrick.getHash(), (err) => {
                    if (err) {
                        return callback(err);
                    }

                    brickTransportStrategy.send(barMapBrick.getHash(), barMapBrick.getTransformedData(), callback);
                });
            }
        });
    };

    this.getBarMap = function (mapDigest, callback) {
        if (typeof mapDigest === "function") {
            callback = mapDigest;
            mapDigest = undefined;
        }

        if (map) {
            return callback(undefined, map);
        }

        if (typeof mapDigest === "undefined") {
            return callback(undefined, bar.createBarMap());
        }

        brickTransportStrategy.getHashForAlias(mapDigest, (err, hashesList) => {
            if (err) {
                return callback(err);
            }

            let barMapId;
            if (hashesList.length === 0) {
                barMapId = mapDigest;
            } else {
                barMapId = hashesList[hashesList.length - 1];
            }
            brickTransportStrategy.get(barMapId, (err, barMapData) => {
                if (err) {
                    return callback(undefined, bar.createBarMap());
                }

                const mapBrick = bar.createBrick();
                mapBrick.setTransformedData(barMapData);
                if (barMapId !== mapBrick.getHash()) {
                    return callback(Error("Invalid data received"));
                }
                map = bar.createBarMap(mapBrick);
                callback(undefined, map);
            });
        });
    };
}

module.exports = EDFSBrickStorage;

