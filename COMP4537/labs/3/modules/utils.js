const util = require('util');
const lang = require('../lang/en/msg.js');

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
        
        // add the downloads folder path to the directory
        const downloadsFolder = path.join(homeDir, 'Downloads');
        
        // combine the whole path together with the file wanted
        const filePath = path.join(downloadsFolder, 'file.txt');
        
        if(fileUtils.checkFileExists("file.txt")){

            fs.appendFile(filePath, text, (err) => {
                console.log(err);
            });

        } else {
        
        fs.writeFile(filePath, text, (err) => {
            console.log(err);
        });

    }
}

    static checkFileExists(fileName) {

        // Get home directory
        const homeDir = os.homedir();
        
        // add the downloads folder path to the directory
        const downloadsFolder = path.join(homeDir, 'Downloads');
        
        // combine the whole path together with the file wanted
        const filePath = path.join(downloadsFolder, fileName);
        
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
        
        // add the downloads folder path to the directory
        const downloadsFolder = path.join(homeDir, 'Downloads');
        
        // combine the whole path together with the file wanted
        const filePath = path.join(downloadsFolder, fileName);

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
                        <p>FileName = ${fileName} does not exist</p>
                    </body>
                </html>`);
    }
}
}



module.exports = {
    dateUtils,
    fileUtils,
    FileReaderUtils
};