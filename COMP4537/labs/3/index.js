
const http = require('http');

const { Lab3Utils } = require('./public/modules/utils'); 

const server = http.createServer((req, res) => {

    url = req.url;

    console.log(url);
    if(url.includes('/COMP4537/labs/3')){
        Lab3Utils.checkEndpoint(req,res);
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

