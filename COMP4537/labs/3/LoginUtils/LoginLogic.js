const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

class Database {
    constructor() {
        this.connection = null;
    }

    async connect() {
        if (!this.connection) {
            try {
                console.log('Attempting to connect to database...');
                this.connection = await mysql.createConnection({
                    host: process.env.HOST,
                    user: process.env.USER,
                    password: process.env.PASSWORD,
                    database: process.env.DATABASE,
                    port: process.env.PORT_DB
                });
                console.log('Database connection successful');
            } catch (err) {
                console.error('Error connecting to database:', err);
            }
        }
    }

    async close() {
        if (this.connection) {
            try {
                console.log('Closing database connection...');
                await this.connection.end();
                this.connection = null;
                console.log('Database connection closed');
            } catch (err) {
                console.error('Error closing database connection:', err);
            }
        }
    }

    async selectQuery(query) {
        await this.connect();
        console.log(`Executing SELECT query: ${query}`);
        try {
            const [results] = await this.connection.execute(query);
            console.log('SELECT query result:', results);
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
        console.log(`Executing INSERT query: ${query}`);
        try {
            const [results] = await this.connection.execute(query);
            console.log('INSERT query result:', results);
            return results;
        } catch (err) {
            console.error('Error executing INSERT query:', err);
            throw err;
        } finally {
            await this.close();
        }
    }

    async updateQuery(query) {
        await this.connect();
        console.log(`Executing UPDATE query: ${query}`);
        try {
            const [results] = await this.connection.execute(query);
            console.log('UPDATE query result:', results);
            return results;
        } catch (err) {
            console.error('Error executing UPDATE query:', err);
            throw err;
        } finally {
            await this.close();
        }
    }

    async deleteQuery(query) {
        await this.connect();
        console.log(`Executing DELETE query: ${query}`);
        try {
            const [results] = await this.connection.execute(query);
            console.log('DELETE query result:', results);
            return results;
        } catch (err) {
            console.error('Error executing DELETE query:', err);
            throw err;
        } finally {
            await this.close();
        }
    }
}

const db = new Database();
const privateKey = Buffer.from(process.env.JWT_PRIVATE_KEY_64, 'base64').toString('utf8');
const publicKey = process.env.JWT_PUBLIC_KEY;

async function checkLogin(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        console.log('Login request body received:', body);

        const { email, password } = JSON.parse(body);
        console.log(`Checking login for email: ${email}`);

        const query = `SELECT id, name, role, password FROM users WHERE email = '${email}'`;
        try {
            const result = await db.selectQuery(query);
            console.log('Database result for login query:', result);

            if (result.length > 0) {
                const user = result[0];
                console.log('User found:', user);

                const match = await bcrypt.compare(password, user.password);
                console.log('Password comparison result:', match);

                if (!match) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ msg: 'Invalid email or password' }));
                    return;
                }

                const checkTokenQuery = `SELECT * FROM validTokens WHERE user_id = '${user.id}'`;
                const tokenResult = await db.selectQuery(checkTokenQuery);
                console.log('Existing token check result:', tokenResult);

                if (tokenResult.length > 0) {
                    const deleteTokenQuery = `DELETE FROM validTokens WHERE user_id = '${user.id}'`;
                    await db.insertQuery(deleteTokenQuery);
                    console.log('Old token deleted for user ID:', user.id);
                }

                const token = jwt.sign({ email, role: user.role }, privateKey, { algorithm: 'RS256', expiresIn: '3h' });
                console.log('Generated JWT token:', token);

                const insertTokenQuery = `INSERT INTO validTokens (user_id, token) VALUES ('${user.id}', '${token}')`;
                await db.insertQuery(insertTokenQuery);
                console.log('New token inserted into validTokens table');

                res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=10800`);
                res.end(JSON.stringify({ publicKey: publicKey }));

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

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        console.log('Signup request body received:', body);

        const { name, email, password } = JSON.parse(body);
        console.log(`Checking signup for email: ${email}`);

        try {
            const checkEmailQuery = `SELECT id FROM users WHERE email = '${email}'`;
            const result = await db.selectQuery(checkEmailQuery);
            console.log('Database result for email check:', result);

            if (result.length > 0) {
                console.log('Duplicate email found');
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

                console.log('Hashed password:', hashedPassword);

                const query = `INSERT INTO users (name, email, password, role) VALUES ('${name}', '${email}', '${hashedPassword}', 'student')`;
                await db.insertQuery(query);
                console.log('User inserted into users table');

                const userIdQuery = `SELECT id FROM users WHERE email = '${email}'`;
                const userResult = await db.selectQuery(userIdQuery);
                console.log('User ID result after signup:', userResult);

                if (userResult.length > 0) {
                    const userId = userResult[0].id;
                    const userRole = userResult[0].role;

                    const deleteTokenQuery = `DELETE FROM validTokens WHERE user_id = '${userId}'`;
                    await db.deleteQuery(deleteTokenQuery);
                    console.log('Old token deleted for new user');

                    const token = jwt.sign({ email, role: userRole }, privateKey, { algorithm: 'RS256', expiresIn: '3h' });
                    console.log('Generated JWT token:', token);

                    const insertTokenQuery = `INSERT INTO validTokens (user_id, token) VALUES ('${userId}', '${token}')`;
                    await db.insertQuery(insertTokenQuery);
                    console.log('New token inserted into validTokens table');

                    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=10800`);
                    res.end(JSON.stringify({ msg: 'User registered successfully', publicKey: publicKey }));
                } else {
                    console.log('User not found after signup');
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
        console.log('Routing request:', req.url);
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
