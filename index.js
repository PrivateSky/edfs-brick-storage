const bar = require("bar");
const ArchiveConfigurator = bar.ArchiveConfigurator;
const createEDFSBrickStorage = require("./EDFSBrickStorage").createEDFSBrickStorage;
ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", createEDFSBrickStorage);
module.exports.createEDFSBrickStorage = createEDFSBrickStorage;
