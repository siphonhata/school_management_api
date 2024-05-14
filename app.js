// Import required modules
const express = require('express');
const bodyParser = require('body-parser');

// Initialize express app
const app = express();

const cors = require('cors');

const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  user: 'postgres',
  host: '192.168.0.131',
  database: 'school_management',
  password: 'postgres',
  port: 5432, 
});

// Use bodyParser middleware to parse JSON requests
app.use(bodyParser.json());
// Use cors middleware to enable CORS
app.use(cors());


async function query(text, params) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }


  async function getUsers() {
    const users = await query('SELECT * FROM users');
    console.log(users);
  }
  
  // Connect to the database and execute a query
  pool.connect((err, client, done) => {
    if (err) {
      console.error('Error connecting to PostgreSQL database', err);
      return;
    }
    console.log('Connected to PostgreSQL database');
  
    // Example query
    getUsers();
  
    // Release the client back to the pool
    done();
  });
  
// Mock user data (Replace this with a real user database)
const users = [
    { email: 'siphonhata@gmail.com', password: '123' },
    { email: 'user2@example.com', password: 'password2' }
];

// Route to handle login requests
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(req.body)
    // Check if user exists
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        // Redirect or respond with success message
        res.json({ message: 'Login successful', user });
    } else {
        // Respond with error message for incorrect credentials
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
