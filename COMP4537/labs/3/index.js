
const http = require('http');
const lang = require('./public/lang/en/msg.js');
const { Lab3Utils } = require('./public/modules/utils'); 

const server = http.createServer((req, res) => {

    let url = req.url;

    console.log(url);
    if(url.includes('/COMP4537/labs/3')){
        Lab3Utils.checkEndpoint(req,res);
    } else {
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
