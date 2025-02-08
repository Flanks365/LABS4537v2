
const http = require('http');
const lang = require('./public/lang/en/msg.js');
const { Lab3Utils } = require('./public/modules/utils'); 
const Lab4Utils = require('./4/public/JS/app.js');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allows all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');


    if (req.method === 'OPTIONS') {
        res.writeHead(204); // No content response
        res.end();
        return;
    }

    let url = req.url;

    console.log(url);
    if(url.includes('/COMP4537/labs/3')){
        Lab3Utils.checkEndpoint(req,res);
    } else if(url.includes('/COMP4537/labs/4/api/definitions'))
        {
            Lab4Utils.queryWord(req,res);
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
