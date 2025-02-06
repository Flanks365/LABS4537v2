const dictionary = {};

const request = 0;

const messages = require("../lang/en/msg");
const util = require('util');

class dictionaryUtils{

    static insertWord(word, meaning, res){
        
        if(!this.findWord(word)){
            
        dictionary[word] = meaning;

        request++;

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`${util.format(messages.SUCCESS,word)}`);

        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`${util.format(messages.FAIL, word)}`);
        }
    }

    static findWord(word){

        return dictionary.includes(word);

    }

    static queryWord(req,res){

        const url = new URL(req.url, `http://${req.headers.host}`);
        const word = url.searchParams.get('word') || '';

        if(word != ''){
            if(this.findWord(word)){
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(`${dictionary[word]}`);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(`${util.format(messages.searchFail, word)}`);
            }

        } else if(word == '') {

        let body = '';

        
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        
        req.on('end', () => {
            const formData = querystring.parse(body);

            const newWord = formData.word;
            const newMeaning = formData.meaning;

            this.insertWord(newWord, newMeaning, res);

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Form submitted successfully');
        });

        }
    }
    
}
module.exports = dictionaryUtils;