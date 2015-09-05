/**
 * Created by Amit Thakkar on 9/4/15.
 */
((require, process, JSON) => {
    "use strict";
    const HTTPS = require('https');
    const HTTP = require('http');
    const SERVER_URL = process.env.SERVER_URL || 'mqa.pge.com';
    const PORT = process.env.PORT || 9090;
    const MY_IP = 'localhost';
    let optionsRequestHandler = (req, res) => {
        var headers = {};
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = true;
        headers["Access-Control-Max-Age"] = '86400'; // 24 hours
        headers["Access-Control-Allow-Headers"] = "X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Authorization, Accept";
        res.writeHead(200, headers);
        res.end();
    };
    let forwardRequest = (req, res) => {
        let postData = "";
        let options = {
            'hostname': SERVER_URL,
            'path': req.url,
            'method': req.method
        };
        options.headers = req.headers;
        delete options.headers['host'];
        delete options.headers['accept-encoding'];
        if (req.method === 'POST' || req.method === 'PUT') {
            postData = JSON.stringify(req.body);
        }
        let request = HTTPS.request(options, (response) => {
            console.log('RESPONSE STATUS: ' + response.statusCode);
            let responseToSend = "", clientheaders;
            response.setEncoding('utf8');
            clientheaders = response.headers;
            response.on('data', function (chunk) {
                responseToSend += chunk;
            });
            setTimeout(function () {
                res.writeHead(response.statusCode, clientheaders);
                res.write(responseToSend);
                res.end();
            }, 500);
        });
        request.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });
        request.write(postData);
        request.end();
    };
    let requestHandler = (req, res) => {
        console.log(req.url);
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