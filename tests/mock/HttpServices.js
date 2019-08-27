let storeBricks = [];

let requestsLimit = 500;

setInterval(() => {
    requestsLimit += 10;
}, 1500);

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
    setTimeout(()=>{
        callback(err, headers);
    },10)

}

function getBrickHashFromUrl(url){
    return url.substring(url.indexOf("/EDFS/")+6);
}

function processPostRequest(url, data, headers, callback) {
let brickHash = getBrickHashFromUrl(url);
    storeBricks[brickHash] = data;
    callback(null, null, headers);
}

function processGetRequest(url, headers, callback) {
    let brickHash = getBrickHashFromUrl(url);
    if (storeBricks[brickHash]) {
        callback(null, storeBricks[brickHash], headers);
    } else {
        let err = {
            statusCode: 404
        };
        callback(err, null, headers);
    }
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

        setTimeout(()=>{
            processGetRequest(url, headers, callback);
        },parseInt(Math.random()*500));
    });
}


module.exports = {
    doHttpGet: doHttpGet,
    doHttpPost: doHttpPost
};
