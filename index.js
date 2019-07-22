const bar = require("bar");
const ArchiveConfigurator = bar.ArchiveConfigurator;
const EDFSBrickStorage = require("./EDFSBrickStorage");

ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", module.exports.createEDFSBrickStorage);
module.exports.createEDFSBrickStorage = function (url) {
    return new EDFSBrickStorage(url);
};