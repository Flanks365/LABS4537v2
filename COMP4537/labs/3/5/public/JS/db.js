const mysql = require('mysql2');
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
                port: process.env.DB_PORT
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
                res.end(JSON.stringify({ error: 'Error executing query' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            }
        });
    }

    
    insertQuery(query, res) {
        this.connect();

        this.connection.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error executing query' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Query executed successfully' }));
            }
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
                res.end(JSON.stringify({ error: 'Query parameter is required' }));
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
                        res.end(JSON.stringify({ error: 'Invalid JSON format' }));
                        return;
                    }

                    requestData.sampleQueries.forEach((query) => {
                        database.insertQuery(query, res);
                    });
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });

        } else if (url.pathname.includes('/COMP4537/labs/5/api/v1/sql/')) {
            const endpoint = url.pathname.split('/sql/')[1];

            if (endpoint === 'select * from Patient') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'You accessed the Patient resource endpoint' }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Endpoint not found' }));
            }

        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request' }));
        }
    }
}
