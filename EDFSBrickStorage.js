function EDFSBrickStorage(endpoint) {
    //ensuring that registry is initialized
    require("./brickTransportStrategies/brickTransportStrategiesRegistry");
    const bar = require("bar");
    const brickTransportStrategy = $$.brickTransportStrategiesRegistry.get(endpoint);
    let map;

    this.setBrickMap = function (brickMap) {
        map = brickMap;
    };

    this.putBrick = function (dlDomain, brick, callback) {
        brickTransportStrategy.send(brick.getHash(), brick.getTransformedData(), callback);
    };

    this.getBrick = function (dlDomain, brickHash, callback) {

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
    this.getMultipleBricks = function (dlDomain, brickHashes, callback) {
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

    this.getAliasVersions = function (brickId, callback) {
        brickTransportStrategy.getHashForAlias(brickId, callback);
    };

    this.updateAlias = function (alias, value, lastValue, callback) {
        if (typeof lastValue === 'function') {
            callback = lastValue;
            lastValue = undefined;
        }
        brickTransportStrategy.attachHashToAlias(alias, value, lastValue, callback);
    };
}

module.exports = EDFSBrickStorage;

