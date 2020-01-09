module.exports.create = (brickTransportStrategyName) => {
    const EDFSBrickStorage = require("./EDFSBrickStorage");
    return new EDFSBrickStorage(brickTransportStrategyName)
};
