const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

require('dotenv').config();

class Database {
    constructor() {
        this.connection = null;
    }

    connect() {
        if (!this.connection) {
            console.log('Connecting to database...');
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
            console.log('Closing database connection...');
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
        console.log(`Executing SELECT query: ${query}`);
        this.connection.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ msg: "error" }));
            } else {
                console.log('Query results:', results);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            }
            this.close();
        });
    }

    insertQuery(query, res) {
        this.connect();
        console.log(`Executing INSERT query: ${query}`);
        this.connection.query(query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ msg: "error" }));
            } else {
                console.log('Insert query results:', results);
            }
            this.close();
        });
    }
}

const db = new Database();

function checkLogin(req, res) {
    let body = '';
    console.log('Login request received');

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const { email, password } = JSON.parse(body);
        console.log(`Received email: ${email}, password: ${password}`);

        const query = `SELECT id, name, role, password FROM users WHERE email = '${email}'`;

        db.selectQuery(query, {
            writeHead: (status, headers) => {
                res.writeHead(status, headers);
            },
            end: (response) => {
                const result = JSON.parse(response);
                if (result.length > 0) {
                    const user = result[0];
                    console.log('User found:', user);

                    bcrypt.compare(password, user.password, (err, match) => {
                        if (err || !match) {
                            console.log('Password mismatch or error during comparison');
                            res.writeHead(401, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ msg: 'Invalid email or password' }));
                            return;
                        }

                        console.log('Password matched, checking for token...');
                        const checkTokenQuery = `SELECT * FROM validTokens WHERE userId = '${user.id}'`;
                        db.selectQuery(checkTokenQuery, {
                            writeHead: (status, headers) => {
                                res.writeHead(status, headers);
                            },
                            end: (tokenResponse) => {
                                const tokenResult = JSON.parse(tokenResponse);
                                if (tokenResult.length > 0) {
                                    console.log('Token found, deleting it...');
                                    const deleteTokenQuery = `DELETE FROM validTokens WHERE userId = '${user.id}'`;
                                    db.insertQuery(deleteTokenQuery, {
                                        writeHead: () => {},
                                        end: () => {}
                                    });
                                }

                                const token = jwt.sign({ email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
                                console.log('Generated new JWT token:', token);

                                const insertTokenQuery = `INSERT INTO validTokens (userId, token) VALUES ('${user.id}', '${token}')`;
                                db.insertQuery(insertTokenQuery, {
                                    writeHead: () => {},
                                    end: () => {}
                                });

                                console.log('Login successful, sending response...');
                                res.end(JSON.stringify({
                                    token,
                                    user: {
                                        id: user.id,
                                        name: user.name,
                                        role: user.role
                                    }
                                }));
                            }
                        });
                    });
                } else {
                    console.log('Invalid email or password');
                    res.end(JSON.stringify({ msg: 'Invalid email or password' }));
                }
            }
        });
    });
}

function checkSignup(req, res) {
    let body = '';
    console.log('Signup request received');

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const { name, email, password } = JSON.parse(body);
        console.log(`Received name: ${name}, email: ${email}, password: ${password}`);

        // Check if email already exists
        const checkEmailQuery = `SELECT id FROM users WHERE email = '${email}'`;

        db.selectQuery(checkEmailQuery, {
            writeHead: (status, headers) => {
                res.writeHead(status, headers);
            },
            end: (response) => {
                const result = JSON.parse(response);
                if (result.length > 0) {
                    console.log('Email already exists');
                    // If the email exists, return a duplicate email response
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify([{ msg: 'duplicate email' }]));
                    return;  // Ensure response is sent and we exit here
                }

                // Proceed with password hashing and user insertion if email is not found
                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) {
                        console.error('Error hashing password:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ msg: 'Error hashing password' }));
                        return;  // Ensure response is sent and we exit here
                    }

                    console.log('Password hashed successfully');
                    const query = `INSERT INTO users (name, email, password, role) VALUES ('${name}', '${email}', '${hashedPassword}', 'student')`;

                    db.insertQuery(query, {
                        writeHead: (status, headers) => {
                            res.writeHead(status, headers);
                        },
                        end: (response) => {
                            console.log('User inserted:', response);
                            if (JSON.parse(response).msg === 'success') {
                                db.selectQuery(`SELECT id FROM users WHERE email = '${email}'`, {
                                    writeHead: (status, headers) => {
                                        res.writeHead(status, headers);
                                    },
                                    end: (response) => {
                                        const result = JSON.parse(response);
                                        if (result.length > 0) {
                                            const userId = result[0].id;
                                            console.log('User ID found:', userId);

                                            // Delete existing token before generating a new one
                                            const deleteTokenQuery = `DELETE FROM validTokens WHERE userId = '${userId}'`;
                                            db.insertQuery(deleteTokenQuery, {
                                                writeHead: () => {},
                                                end: () => {}
                                            });

                                            // Generate a new token
                                            const token = jwt.sign({ email, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '2h' });
                                            console.log('Generated new token:', token);

                                            // Insert the new token into validTokens
                                            const insertTokenQuery = `INSERT INTO validTokens (userId, token) VALUES ('${userId}', '${token}')`;
                                            db.insertQuery(insertTokenQuery, {
                                                writeHead: () => {},
                                                end: () => {}
                                            });

                                            res.end(JSON.stringify({
                                                token,
                                                user: {
                                                    id: userId,
                                                    name,
                                                    email,
                                                    role: 'student'
                                                }
                                            }));
                                        } else {
                                            console.log('User not found after insertion');
                                            res.end(JSON.stringify({ msg: 'User not found' }));
                                        }
                                    }
                                });
                            } else {
                                console.log('Error during user insertion:', response);
                                res.end(response);
                            }
                        }
                    });
                });
            }
        });
    });
}

class LoginUtils {
    static routeRequest(req, res) {
        console.log(`Routing request: ${req.url}`);
        if (req.url.includes('/login')) {
            checkLogin(req, res);
        } else if (req.url.includes('/signup')) {
            checkSignup(req, res);
        } else {
            console.log('Invalid endpoint');
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ msg: 'Invalid endpoint' }));
        }
    }
}

module.exports = LoginUtils;
