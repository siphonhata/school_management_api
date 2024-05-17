const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

async function hashPassword(password)
{
  const saltRounds = 10; 
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
} 

router.post('/create_user', async (req, res) => {
    try 
    {
      const 
      {
        first_name, last_name, id_number, date_of_birth, gender,
        email, phone_number, address, role, password,
      } = req.body;
      
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

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
   
  if (!email || !password) 
  {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  
  try 
  {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) 
    {
      return res.status(401).json({success: false, message: 'User does not exist' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) 
    {
      return res.status(401).json({success: false, message: 'Invalid password' });
    }
    
    return res.json({ user: user, message: 'Login successful', success: true });
  } 
  catch (error) 
  {
    console.error(error);
    return res.status(500).json({ message: 'Login failed', success: false });
  }
});

module.exports = router;
  