const mysql = require('mysql2');
const msg = require('../lang/en/msg');
require('dotenv').config();

class Database {
    constructor() {
        this.connection = null;
    }

   
    connect() {
        if (!this.connection) {
            this.connection = mysql.createConnection({
                host: process.env.HOST,
                user: process.env.USER,
                password: process.env.PASSWORD,
                database: process.env.DATABASE,
                port: process.env.PORT_DB
            });

            this.connection.connect((err) => {
                if (err) {
                    console.error('Error connecting to database:', err);
                } else {
                    console.log('Connected to database');
                }
            });
        }
    }

    
    close() {
        if (this.connection) {
            this.connection.end((err) => {
                if (err) {
                    console.error('Error closing database connection:', err);
                } else {
                    console.log('Connection to database closed');
                }
                this.connection = null;
            });
        }
    }

    
    selectQuery(query, res) {
        this.connect();

        this.connection.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ msg: msg.error }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            }
            this.close();
        });
    }

    
    insertQuery(query, res) {
        this.connect();

        this.connection.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ msg: msg.failed }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ msg: msg.success }));
            }
            this.close();
        });
    }
}

const database = new Database(); 

// Function to check if table exists and create it if necessary
// chatgpt recommended making it a promise to ensure it completes before proceeding
function checkAndCreatePatientTable() {

    return new Promise((resolve, reject) => {
        database.connect();

        const checkTableQuery = `
            SELECT * 
            FROM information_schema.tables
            WHERE table_schema = 'Lab5' 
            AND table_name = 'patient'
            LIMIT 1;
        `;

        database.connection.query(checkTableQuery, (err, results) => {
            if (err) {
                console.error('Error checking if table exists:', err);
                reject(err);
                return;
            }

            if (results.length === 0) {
                console.log('Table "patient" does not exist, creating now...');
                const createTableQuery = `
                    CREATE TABLE patient (
                        patientid INT(11) NOT NULL AUTO_INCREMENT,
                        name VARCHAR(100) NOT NULL,
                        dateOfBirth DATETIME NOT NULL,
                        PRIMARY KEY (patientid)
                    ) ENGINE=InnoDB;
                `;

                database.connection.query(createTableQuery, (err) => {
                    if (err) {
                        console.error('Error creating table:', err);
                        reject(err);
                    } else {
                        console.log('Table "patient" created successfully');
                        resolve();
                    }
                });
            } else {
                console.log('Table "patient" already exists');
                resolve();
            }
        });
    });

}

class DataBaseUtils {
    static async routeRequ(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);

        await checkAndCreatePatientTable(); // Ensure table exists before proceeding

        if (req.method === 'GET') {
            const query = url.searchParams.get('query');

            if (!query) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: msg.missing }));
                return;
            } else if (/CREATE/i.test(query)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: msg.invalid }));
                return;
            }

            database.selectQuery(query, res); 

        } else if (req.method === 'POST') {
            let body = '';

            req.on('data', (chunk) => {
                body += chunk;
            });

            req.on('end', () => {
                try {
                    const requestData = JSON.parse(body);
                    if (!Array.isArray(requestData.sampleQueries)) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: msg.invalid }));
                        return;
                    }

                    requestData.sampleQueries.forEach((query) => {
                       
                        if (/CREATE/i.test(query)) {
                            console.log(`Query invalidated: ${query}`);
                            return; 
                        }
                    
                        // If query does not contain 'CREATE', execute the query
                        database.insertQuery(query, res);
                    });
                    
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: msg.invalid }));
                }
            });

        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: msg.invalid }));
        }
    }
}

module.exports = { DataBaseUtils };