let bricks = {
    "aaaa": "111111111111111",
    "bbbb": "22222222222222"
}

let requestsLimit = 100;

setInterval(() => {
    requestsLimit += 10;
}, 1000);


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

function processPostRequest(url, data, callback) {

    
}

function processGetRequest(url, callback) {

}

function doHttpPost(url, data, callback) {
    checkLimit((err, headers) => {
        if (err) {
            return callback(err, null, headers);
        }

        processPostRequest(url, data, callback);

    })
}

function doHttpGet(url, callback) {
    console.log("Sunt aici");
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