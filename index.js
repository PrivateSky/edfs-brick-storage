module.exports.createBrickStorageService = (endpoint) => {
    const BrickStorageService = require("./BrickStorageService");
    return new BrickStorageService(endpoint)
};

module.exports.createAnchoringService = (endpoint) => {
    const AnchoringService = require("./AnchoringService");
    return new AnchoringService(endpoint)
};
