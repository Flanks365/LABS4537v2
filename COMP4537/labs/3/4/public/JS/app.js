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

class getRE {
    
    requestNum;
    message;
    size_of_dict;
    date_string;

    constructor(requestNum, message, size_of_dict, date_string){
        this.requestNum = requestNum;
        this.message = message;
        this.size_of_dict = size_of_dict;
        this.date_string = date_string;
    }

    getNum(){
        return this.requestNum;
    }

    getMessage(){
        return this.message;
    }

    getSize(){
        return this.size_of_dict;
    }

    getDate(){
        return this.date_string;
    }
}

const messages = require("../lang/en/msg");
const util = require('util');
const querystring = require('querystring');



class dictionaryUtils{

    static insertWord(word, meaning, res){
        const validStringRegex = /^[A-Za-z\s]+$/;
        
        if(!this.findWord(word)){
            
        dictionary[word] = meaning;

        request++;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        console.log(word);
        const succ = new getRE(request, messages.SUCCESS, Object.keys(dictionary).length, new Date().toString());

        res.end(JSON.stringify(succ));

        } else {
            request++;
            console.log(word);
            const fail = new getRE(request, messages.FAIL, Object.keys(dictionary).length, new Date().toString());
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(fail));
        }
    }

    static findWord(word){

        return word in dictionary;

    }

    static queryWord(req, res) {

        const url = new URL(req.url, `http://${req.headers.host}`);
        

        if (req.method === 'GET') { 
            const word = url.searchParams.get('word').trim() || '';

            const validStringRegex = /^[A-Za-z\s]+$/;
    
            if (word !== '') {
                if (this.findWord(word)) {

                    request++;
                    console.log(word);
                    const result = new dataBundle(request, word, dictionary[word]);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));

                } else if(validStringRegex.test(word)){

                    request++;
                    console.log(word);
                    const result = new dataBundle(request, word, "Does Not Exist");
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));

                } else  {
                    request++;
                    console.log(word);
                    const result = new dataBundle(request, word, "Does Not Exist");
                    res.writeHead(400, { 'Content-Type': 'application/json' });
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
                let newWord, newMeaning;
                
                if (req.headers['content-type'] === 'application/json') {
                    try {

                        const jsonData = JSON.parse(body);
                        newWord = jsonData.word.trim();
                        newMeaning = jsonData.meaning.trim();

                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end();
                        return;
                    }
                } else {
                    const formData = querystring.parse(body);
                    newWord = formData.word.trim();
                    newMeaning = formData.meaning.trim();
                }
            
                // Regex to allow only non-empty alphabetic strings (no numbers or special characters)
                const validStringRegex = /^[A-Za-z\s]+$/;
            
                if (!newWord || !newMeaning || 

                    !validStringRegex.test(newWord) || 

                    !validStringRegex.test(newMeaning) || newWord === '' || newMeaning === '') {

                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end();

                    return;
                }
            
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