
const http = require('http');
const lang = require('./public/lang/en/msg.js');
const { Lab3Utils } = require('./public/modules/utils'); 
const Lab4Utils = require('./4/public/JS/app.js');
const { DataBaseUtils } = require('./5/public/JS/db.js');
const LoginUtils = require('./LoginUtils/LoginLogic.js');


const allowedOrigin = [
    'https://octopus-app-x9uen.ondigitalocean.app/',
    'https://my-memory-game2.netlify.app/',
    'https://seashell-app-ojo24.ondigitalocean.app/'
]


const server = http.createServer((req, res) => {
    const origin = req.headers.origin;

    // If the origin is in the allowed origins list, set the Access-Control-Allow-Origin header
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin); // Dynamically set the allowed origin
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials (cookies)
    } else {
        res.setHeader('Access-Control-Allow-Origin', ''); // Deny access if origin is not allowed
    }

    let url = req.url;

    console.log(url);
    if(url.includes('/COMP4537/labs/3')){
        Lab3Utils.checkEndpoint(req,res);
    } else if(url.includes('/COMP4537/labs/4/api/definitions'))
        {
            Lab4Utils.queryWord(req,res);
    } else if(url.includes('/COMP4537/labs/5/api/v1/sql')){

        DataBaseUtils.routeRequ(req, res);

    } else if (url.includes('/LoginStuff')){
        LoginUtils.routeRequest(req, res);
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<html>
                    <body>
                        <p>${lang.miss}</p>
                    </body>
                </html>`);
    }
});


server.listen(8080, () => {
    console.log(`Server running`);
}).on('error', (err) => {
    console.error(err);
});
