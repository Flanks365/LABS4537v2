
const http = require('http');

const { dateUtils, fileUtils, FileReaderUtils } = require('./modules/utils'); 

const server = http.createServer((req, res) => {

    const url = new URL(req.url, `http://${req.headers.host}`);

    if(url.pathname === '/getDate/'){
        const name = url.searchParams.get('name') || 'Guest';
        
        dateUtils.getDate(name, res);

    } else if (url.pathname === '/writeFile'){
        const text = url.searchParams.get('text') || '';
        
        fileUtils.writeFile(text, res);
    } else if(url.pathname === '/readFile/'){
        const fileName = url.searchParams.get('fileName') || '';

        FileReaderUtils.readTextFile(fileName,res);

    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

