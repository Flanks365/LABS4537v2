const dictionary = {};

let request = 0;

class dataBundle{
    num;
    word;
    meaning;
    constructor(num, word, meaning){
        this.num = num;
        this.word = word;
        this.meaning = meaning;
    }

    getNum(){
        return this.num;
    }

    getWord(){
        return this.word;
    }

    getMeaning(){
        return this.meaning;
    }
}

const messages = require("../lang/en/msg");
const util = require('util');
const querystring = require('querystring');


class dictionaryUtils{

    static insertWord(word, meaning, res){
        
        if(!this.findWord(word)){
            
        dictionary[word] = meaning;

        request++;

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`${util.format(messages.SUCCESS,request,word)}`);

        } else {
            request++;
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`${util.format(messages.FAIL,request , word)} 
                    ${util.format(messages.REQUEST,request, new Date().toString(), Object.keys(dictionary).length)}`);
        }
    }

    static findWord(word){

        return word in dictionary;

    }

    static queryWord(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        if (req.method === 'GET') { 
            const word = url.searchParams.get('word') || '';
    
            if (word !== '') {
                if (this.findWord(word)) {
                    request++;
                    const result = new dataBundle(request, word, dictionary[word]);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } else {
                    request++;
                    const result = new dataBundle(request, word, "Does Not Exist");
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                }
            } else {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(`${messages.NOQUERY}`);
            }
        } 
        else if (req.method === 'POST') { 
            let body = '';
    
            req.on('data', (chunk) => {
                body += chunk.toString();
            });
    
            req.on('end', () => {
                const formData = querystring.parse(body);
                const newWord = formData.word;
                const newMeaning = formData.meaning;
    
                this.insertWord(newWord, newMeaning, res);

            });
        } 
        else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
        }
    }
    
    
}
module.exports = dictionaryUtils;