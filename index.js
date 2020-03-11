module.exports.create = (endpoint) => {
    const EDFSBrickStorage = require("./EDFSBrickStorage");
    return new EDFSBrickStorage(endpoint)
};
