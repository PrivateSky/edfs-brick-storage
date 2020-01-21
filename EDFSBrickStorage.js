let PutBrickQueue = require("./EDFSBrickQueue").EDFSPutBrickQueue;
let GetBrickQueue = require("./EDFSBrickQueue").EDFSGetBrickQueue;
let bricksQueue = [];

function EDFSBrickStorage(brickTransportStrategyName) {

    const bar = require("bar");
    const brickTransportStrategy = $$.brickTransportStrategiesRegistry.get(brickTransportStrategyName);
    let map;

    this.setBarMap = function (barMap) {
        map = barMap;
    };

    this.putBrick = function (brick, callback) {
        brickTransportStrategy.send(brick.getHash(), brick.getTransformedData(), callback);
        // $$.remote.doHttpPost(url + "/EDFS/" + brick.getHash(), brick.getTransformedData(), callback);
        // putBrick(brick.getHash(), brick, true, callback);
    };

    function putBrick(brickId, brick, isSerial, callback) {
        if (typeof isSerial === "function") {
            callback = isSerial;
            isSerial = undefined;
        }
        let callbackSent = false;

        let handler = function (err, data, headers) {
            if (!isConnectionError(err)) {
                if (callbackSent) {
                    if (err) {
                        callback(err);
                    }
                } else {
                    callback(err, data, headers)
                }
            }
        };
        let url = getStorageUrlAddress();

        putBrickQueue.addBrickRequest(url + "/EDFS/" + brickId,
            brick.getTransformedData(),
            handler);

        if (isSerial && putBrickQueue.getQueueFreeSlots() > 0) {
            callbackSent = true;
            callback();
        }
    }


    this.getBrick = function (brickHash, callback) {

        brickTransportStrategy.get(brickHash, (err, brickData) => {
            if (err) {
                return callback(err);
            }

            const brick = bar.createBrick();
            brick.setTransformedData(brickData);
            callback(undefined, brick);
        });
    };

    this.deleteBrick = function (brickHash, callback) {
        throw new Error("Not implemented");
    };

    this.putBarMap = function (barMap, callback) {
        map = barMap;
        const barMapBrick = barMap.toBrick();
        barMapBrick.setTransformParameters(barMap.getTransformParameters());

        let brickId = barMapBrick.getId();
        if (!brickId) {
            brickId = barMapBrick.getHash();
            barMapBrick.setId(brickId);
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
                    return callback(err);
                }

                const mapBrick = bar.createBrick();
                mapBrick.setTransformedData(barMapData);
                map = bar.createBarMap(mapBrick);
                callback(undefined, map);
            });
        });
    };

    //------------------------------------------ internal methods ---------------------------------------------------

    function isConnectionError(err) {
        if (err && err.code === "ECONNREFUSED") {
            console.error("EDFS Server is unavailable! Try again later!");
            return true;
        }
        return false;
    }

    function handleBricksOrder() {
        let brickRequest = bricksQueue[0];
        if (brickRequest && brickRequest.data) {
            let data = brickRequest.data;
            if (!isConnectionError(data.err)) {
                const brick = bar.createBrick();
                brick.setTransformedData(data.brickData);
                brickRequest.callback(data.err, brick);
                bricksQueue.shift();
                handleBricksOrder();
            }

        }
    }
}

module.exports = EDFSBrickStorage;

