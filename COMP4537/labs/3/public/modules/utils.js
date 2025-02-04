const util = require('util');
const lang = require('../lang/en/msg');

// node file system module
const fs = require('fs');

// node path module
const path = require('path');

// node operating system module
const os = require('os');

// chat gpt used for generating generic way to get the path

class dateUtils {
    static getDate(name, res){
        res.writeHead(200, { 'Content-Type': 'text/html' });

        res.end(`<html>
                    <head><title>Hello</title></head>
                    <style>
                        body {
                            color: blue;
                        }
                    </style>
                    <body>
                        ${dateUtils.welcomeMsg(name)}
                    </body>
                 </html>`);
    }

    static welcomeMsg(name){
        return util.format(lang.msg, name, new Date().toString());
    }
}

class fileUtils{

    static writeFile(text,res){

        // Get home directory
        const homeDir = os.homedir();
        
        // combine the whole path together with the file wanted
        const filePath = path.join(homeDir, 'file.txt');
        
        if(fileUtils.checkFileExists("file.txt")){

            fs.appendFile(filePath, text, (err) => {
                console.log(err);
            });

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<html>
                        <head><title>File Content</title></head>
                        <body>
                            <p>${lang.success}</p>
                        </body>
                    </html>`);

        } else {
        
        fs.writeFile(filePath, text, (err) => {
            console.log(err);
        });

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<html>
                    <head><title>File Content</title></head>
                    <body>
                        <p>${lang.success}</p>
                    </body>
                </html>`);

    }
}

    static checkFileExists(fileName) {

        // Get home directory
        const homeDir = os.homedir();
        
        
        // combine the whole path together with the file wanted
        const filePath = path.join(homeDir, fileName);
        
        // using the file system module to check if the file exists
        // with the path created above
        if (fs.existsSync(filePath)) {
            console.log(`File exists: ${filePath}`);
            return true;
        } else {
            console.log(`File does not exist: ${filePath}`);
            return false;
        }
    }
}


class FileReaderUtils{
    static readTextFile(fileName,res){
        // Get home directory
        const homeDir = os.homedir();
        
        
        // combine the whole path together with the file wanted
        const filePath = path.join(homeDir, fileName);

        if(fileUtils.checkFileExists(fileName)){
            
            fs.readFile(filePath, 'utf8', (err, data) => {

                if (err) {
                    console.error(err);
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`<html>
                            <head><title>File Content</title></head>
                            <body>
                                <p>${data}</p>
                            </body>
                        </html>`);
            });

    } else {

        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<html>
                    <head><title>File Content</title></head>
                    <body>
                        <p>${fileName} ${lang.fail}</p>
                    </body>
                </html>`);
    }
}
}

class Lab3Utils {
    static checkEndpoint(req,res){
        const url = new URL(req.url, `http://${req.headers.host}`);

        if(url.pathname === '/COMP4537/labs/3/getDate/'){
            const name = url.searchParams.get('name') || 'Guest';
            
            dateUtils.getDate(name, res);
    
        } else if (url.pathname === '/COMP4537/labs/3/writeFile/'){
            const text = url.searchParams.get('text') || '';
            
            fileUtils.writeFile(text, res);
        } else if(url.pathname === '/COMP4537/labs/3/readFile/'){
            const fileName = url.searchParams.get('fileName') || '';
    
            FileReaderUtils.readTextFile(fileName,res);
    }
}
}



module.exports = {
    dateUtils,
    fileUtils,
    FileReaderUtils,
    Lab3Utils
};