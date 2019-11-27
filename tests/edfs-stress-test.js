//process.env.NO_LOGS = "true";
require("../../../psknode/bundles/pskruntime");
require("../../../psknode/bundles/virtualMQ");
require("../../../psknode/bundles/edfsBar");
const bar = require("bar");
require("edfs-brick-storage");
const ArchiveConfigurator = bar.ArchiveConfigurator;
//const assert = require("double-check").assert;
const folderPath = "D:/temp/poze2";
const createFsAdapter = bar.createFsAdapter;
ArchiveConfigurator.prototype.registerDiskAdapter("fsAdapter",createFsAdapter);
const archiveConfigurator = new ArchiveConfigurator();
archiveConfigurator.setDiskAdapter("fsAdapter");
archiveConfigurator.setBufferSize(256);
const tempFolder = "./tmp";

const VirtualMQ = require("virtualmq");
let PORT = 10000;

function createServer() {
    return new Promise((resolve, reject) => {
        let server = VirtualMQ.createVirtualMQ(PORT, tempFolder, undefined, (err, res) => {
            if (err) {
                console.log("Failed to create VirtualMQ server on port ", PORT);
                console.log("Trying again...");
                if (PORT > 0 && PORT < 50000) {
                    PORT++;
                    createServer();
                } else {
                    reject(err);
                }
            } else {
                console.log("Server ready and available on port ", PORT);
                let url = `http://127.0.0.1:${PORT}`;
                resolve({server, url});
            }
        });
    })
}


let sendFolder = function (server, url) {


    archiveConfigurator.setStorageProvider("EDFSBrickStorage", url);
    const archive = new bar.Archive(archiveConfigurator);

    archive.addFolder(folderPath, (err, mapDigest) => {
        if (err) {
            console.log(err);
        }
        console.log(mapDigest);
    });

};


createServer().then((data) => {

    sendFolder(folderPath, data.url);

}).catch((err) => {
    console.log(err);
});

