// Import required modules
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');

app.use(bodyParser.json());
app.use(cors());


async function hashPassword(password)
{
  const saltRounds = 10; // Adjust as needed
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
} 
  //CRUD Endpoints

  // Endpoint to create a new user
app.post('/users', async (req, res) => 
  {
    try 
    {
      const 
      {
        first_name, last_name, id_number, date_of_birth, gender,
        email, phone_number, address, role, password,
      } = req.body;
      //Hashing the password using salt
      const hashedPassword = await hashPassword(password)
      const result = await prisma.users.create({data: {first_name, last_name, id_number, date_of_birth, gender, email, phone_number, address, role, password: hashedPassword}})
      
      res.status(201).json(result);
    } 
    catch (error) 
    {
      console.error('Error creating user:', error);
      res.status(500).send('Internal Server Error');
    }
  });

// Route to handle login requests
app.post('/login', async (req, res) => 
  {
    const { email, password } = req.body;
    
    // 1. Validate request body
    if (!email || !password) 
    {
      return res.status(400).json({ error: 'Missing email or password' });
    }
  // 2. Find user by email
    try 
    {
      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) 
      {
        return res.status(401).json({ error: 'User does not exist' });
      }

    // 3. Compare password hashes
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) 
      {
        return res.status(401).json({ error: 'Invalid password' });
      }

    // 4. Login successful (generate session or token here, optional)
      return res.json({ message: 'Login successful', success: true });
    } 
    catch (error) 
    {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
