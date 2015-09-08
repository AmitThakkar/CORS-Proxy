/**
 * Created by Amit Thakkar on 9/4/15.
 */
(function (Object) {
    "use strict";
    Object.defineProperty(Object.prototype, "extend", {
        enumerable: false,
        value: function (from) {
            var props = Object.getOwnPropertyNames(from);
            var dest = this;
            props.forEach(function (name) {
                if (name in dest) {
                    var destination = Object.getOwnPropertyDescriptor(from, name);
                    Object.defineProperty(dest, name, destination);
                }
            });
            return this;
        }
    });
})(Object);
((require, process, JSON) => {
    "use strict";
    // Require Modules
    const HTTPS = require('https');
    const HTTP = require('http');

    // Actual Server URL
    const SERVER_URL = process.env.SERVER_URL || 'mqa.pge.com';

    // Proxy NodeJS Server Details
    const PORT = process.env.PORT || 9090;
    const MY_IP = 'localhost';

    let optionsRequestHandler = (req, res) => {
        var headers = {};
        headers["Access-Control-Allow-Origin"] = req.headers.origin;
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = true;
        headers["Access-Control-Max-Age"] = '86400';
        headers["Access-Control-Allow-Headers"] = "X-RAS-API-USERKEY, cocGUID, SECAPIKEY, PGE_LOGIN_NAME, Content-Type";
        res.writeHead(200, headers);
        res.end();
        console.log("Processed Request:", req.url, "Method:", req.method);
    };
    let getHeadersFromRequest = (req) => {
        let options = {
            'hostname': SERVER_URL,
            'path': req.url,
            'method': req.method
        };
        options.headers = req.headers.extend({});
        delete options.headers['host'];
        delete options.headers['accept-encoding'];
        return options;
    };
    let forwardRequest = (req, res) => {
        let postData = "";
        let options = getHeadersFromRequest(req);
        if (req.body) {
            postData = JSON.stringify(req.body);
        }
        let request = HTTPS.request(options, (response) => {
            console.log('Request:', req.url, 'RESPONSE STATUS: ' + response.statusCode, 'Method:', req.method);
            response.setEncoding('utf8');
            var responseHeaders = response.headers.extend({});
            responseHeaders['access-control-allow-origin'] = req.headers.origin;
            if (responseHeaders && responseHeaders['set-cookie'] && responseHeaders['set-cookie'].length) {
                responseHeaders['set-cookie'][0] = responseHeaders['set-cookie'][0].replace(/domain=\.pge\.com; secure/, "domain=localhost;");
            }
            res.writeHead(response.statusCode, responseHeaders);
            response.on('data', function (chunk) {
                res.write(chunk);
            });
            response.on('end', function () {
                res.end();
                console.log("Completing Request:", req.url, "Method:", req.method);
            });
        });
        request.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });
        request.write(postData);
        request.end();
    };
    let requestHandler = (req, res) => {
        console.log("\n==============================================================================");
        console.log("Starting Request:", req.url, "Method:", req.method);
        if (req.method === 'OPTIONS') {
            optionsRequestHandler(req, res);
        } else {
            forwardRequest(req, res);
        }
    };
    HTTP.createServer(requestHandler).listen(PORT, () => {
        console.log('Server running at HTTP://' + MY_IP + ':' + PORT);
    });
})(require, process, JSON);