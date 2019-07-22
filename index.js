const EDFSBrickStorage = require("./EDFSBrickStorage");
module.exports.createEDFSBrickStorage = function (url) {
    return new EDFSBrickStorage(url);
};