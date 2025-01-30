
const http = require('http');

const { Lab3Utils } = require('./public/modules/utils'); 
const {missing } = require('./public/lang/en/msg');

const server = http.createServer((req, res) => {

    let url = req.url;

    console.log(url);
    if(url.includes('/COMP4537/labs/3')){
        Lab3Utils.checkEndpoint(req,res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<html>
                    <body>
                        <p>${missing.miss}</p>
                    </body>
                </html>`);
    }
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; 

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
}).on('error', (err) => {
    console.error(err);
});
