
const http = require('http');

const { Lab3Utils } = require('./public/modules/utils'); 
const { miss } = require('./public/lang/en/msg');

http.createServer((req, res) => {

    let url = req.url;

    console.log(url);
    if(url.includes('/COMP4537/labs/3')){
        Lab3Utils.checkEndpoint(req,res);
    }
    else{
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<html>
                    <body>
                        <p>${miss.miss}</p>
                    </body>
                </html>`);
    }
}).listen(process.env.PORT || 3000);

