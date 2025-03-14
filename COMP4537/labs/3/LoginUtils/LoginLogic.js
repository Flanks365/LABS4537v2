const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        if (!this.connection) {
            console.log('Connecting to database...');
            try {
                this.connection = await mysql.createConnection({
                    host: process.env.HOST,
                    user: process.env.USER,
                    password: process.env.PASSWORD,
                    database: process.env.DATABASE,
                    port: process.env.PORT_DB
                });
                console.log('Connected to database');
            } catch (err) {
                console.error('Error connecting to database:', err);
            }
        }
    }

    async close() {
        if (this.connection) {
            console.log('Closing database connection...');
            try {
                await this.connection.end();
                console.log('Connection to database closed');
                this.connection = null;
            } catch (err) {
                console.error('Error closing database connection:', err);
            }
        }
    }

    async selectQuery(query) {
        await this.connect();
        try {
            console.log(`Executing SELECT query: ${query}`);
            const [results] = await this.connection.execute(query);
            console.log('Query results:', results);
            return results;
        } catch (err) {
            console.error('Error executing SELECT query:', err);
            throw err;
        } finally {
            await this.close();
        }
    }

    async insertQuery(query) {
        await this.connect();
        try {
            console.log(`Executing INSERT query: ${query}`);
            const [results] = await this.connection.execute(query);
            console.log('Insert query results:', results);
            return results;
        } catch (err) {
            console.error('Error executing INSERT query:', err);
            throw err;
        } finally {
            await this.close();
        }
    }
}

const db = new Database();

async function checkLogin(req, res) {
    let body = '';
    console.log('Login request received');

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        const { email, password } = JSON.parse(body);
        console.log(`Received email: ${email}, password: ${password}`);

        const query = `SELECT id, name, role, password FROM users WHERE email = '${email}'`;
        try {
            const result = await db.selectQuery(query);
            if (result.length > 0) {
                const user = result[0];
                console.log('User found:', user);

                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    console.log('Password mismatch or error during comparison');
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ msg: 'Invalid email or password' }));
                    return;
                }

                console.log('Password matched, checking for token...');
                const checkTokenQuery = `SELECT * FROM validTokens WHERE user_id = '${user.id}'`;
                const tokenResult = await db.selectQuery(checkTokenQuery);
                if (tokenResult.length > 0) {
                    console.log('Token found, deleting it...');
                    const deleteTokenQuery = `DELETE FROM validTokens WHERE user_id = '${user.id}'`;
                    await db.insertQuery(deleteTokenQuery);
                }

                const token = jwt.sign({ email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
                console.log('Generated new JWT token:', token);

                const insertTokenQuery = `INSERT INTO validTokens (userId, token) VALUES ('${user.id}', '${token}')`;
                await db.insertQuery(insertTokenQuery);

                console.log('Login successful, sending response...');
                res.end(JSON.stringify({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        role: user.role
                    }
                }));
            } else {
                console.log('Invalid email or password');
                res.end(JSON.stringify({ msg: 'Invalid email or password' }));
            }
        } catch (err) {
            console.error('Error during login process:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ msg: 'Error during login process' }));
        }
    });
}

async function checkSignup(req, res) {
    let body = '';
    console.log('Signup request received');

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        const { name, email, password } = JSON.parse(body);
        console.log(`Received name: ${name}, email: ${email}, password: ${password}`);

        try {
            const checkEmailQuery = `SELECT id FROM users WHERE email = '${email}'`;
            const result = await db.selectQuery(checkEmailQuery);
            if (result.length > 0) {
                console.log('Email already exists');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([{ msg: 'duplicate email' }]));
                return;
            }

            bcrypt.hash(password, 10, async (err, hashedPassword) => {
                if (err) {
                    console.error('Error hashing password:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ msg: 'Error hashing password' }));
                    return;
                }

                console.log('Password hashed successfully');
                const query = `INSERT INTO users (name, email, password, role) VALUES ('${name}', '${email}', '${hashedPassword}', 'student')`;
                const insertResult = await db.insertQuery(query);

                console.log('User inserted:', insertResult);
                const userIdQuery = `SELECT id FROM users WHERE email = '${email}'`;
                const userResult = await db.selectQuery(userIdQuery);

                if (userResult.length > 0) {
                    const userId = userResult[0].id;
                    console.log('User ID found:', userId);

                    const deleteTokenQuery = `DELETE FROM validTokens WHERE user_id = '${userId}'`;
                    await db.insertQuery(deleteTokenQuery);

                    const token = jwt.sign({ email, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '2h' });
                    console.log('Generated new token:', token);

                    const insertTokenQuery = `INSERT INTO validTokens (user_id, token) VALUES ('${userId}', '${token}')`;
                    await db.insertQuery(insertTokenQuery);

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
            });
        } catch (err) {
            console.error('Error during signup process:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ msg: 'Error during signup process' }));
        }
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
