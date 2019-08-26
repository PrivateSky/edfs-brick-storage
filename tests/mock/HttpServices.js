let storeBricks = [];

let requestsLimit = 40;

setInterval(() => {
    requestsLimit += 10;
}, 2000);


function checkLimit(callback) {

    let headers = [];
    let err = null;

    if (requestsLimit > 0) {
        requestsLimit--;
        headers['x-ratelimit-remaining'] = requestsLimit;
    } else {
        err = {
            statusCode: 429
        };
    }
    callback(err, headers);
}

function getBrickHashFromUrl(url){
    return url.substring(url.indexOf("/EDFS/")+6);
}

function processPostRequest(url, data, headers, callback) {
let brickHash = getBrickHashFromUrl(url);
    storeBricks[brickHash] = data;
    callback(null, null, headers);
}

function processGetRequest(url, callback) {

}

function doHttpPost(url, data, callback) {
    checkLimit((err, headers) => {
        if (err) {
            return callback(err, null, headers);
        }
        processPostRequest(url, data, headers, callback);

    })
}

function doHttpGet(url, callback) {
    checkLimit((err, headers) => {
        if (err) {
            return callback(err, null, headers);
        }
        processGetRequest(url, callback);

    })
}


module.exports = {
    doHttpGet: doHttpGet,
    doHttpPost: doHttpPost
};
