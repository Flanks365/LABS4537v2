
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


server.listen(8080, () => {
    console.log(`Server running`);
}).on('error', (err) => {
    console.error(err);
});
