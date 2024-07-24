require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.SECRET_KEY);
const Contact = require('./backend/models/Contact');
const productRoutes = require('./backend/routes/productRoutes');
const connectDB = require('./backend/config/db');

// Initialize the Express app
const app = express();

// Middleware setup
app.use(express.json());  // Middleware to parse JSON bodies
app.use(cors());  // Enable Cross-Origin Resource Sharing

// Database Connection
connectDB();  // Connect to MongoDB

// Contact Routes
app.get('/contact', (req, res) => {
  res.json({ message: 'This is the contact page' });
});

app.post('/contact', async (req, res) => {
  const { fullName, email, message, city } = req.body;
  try {
    let newContact = new Contact({
      fullName, email, message, city,
    });
    await newContact.save();
    console.log('New contact has been saved');
    res.status(201).json({ message: 'Contact saved successfully' });
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).json({ error: 'Failed to save contact' });
  }
});

// Stripe Integration Route
app.post('/payment', async (req, res) => {
  const { product, token, price } = req.body;

  console.log(`Payment of ${price} is successfully completed!`);

  try {
    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id,
    });

    const charge = await stripe.charges.create({
      amount: price * 100,
      currency: 'INR',
      customer: customer.id,
      receipt_email: token.email,
      description: 'Processing Payment',
    });

    res.status(200).json(charge);
  } catch (error) {
    console.error('Stripe payment error:', error);
    res.status(500).json({ error: 'Payment failed' });
  }
});

// API Routes
app.use('/api/products', productRoutes);

// Serve frontend assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Hey There, Greetings From The Server. Have a Good Day :)');
  });
}

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
