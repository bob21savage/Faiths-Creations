const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'templates' directory
app.use(express.static(path.join(__dirname, 'templates')));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Serve product catalog
app.get('/catalog', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'product_catalog.html'));
});

// Serve other HTML files
app.get('/product/:id', (req, res) => {
    const productId = req.params.id;
    res.sendFile(path.join(__dirname, 'templates', `product${productId}.html`));
});

// Handle payment intent creation
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, productName, productDescription, vin } = req.body;
        
        // Here you would typically create a payment intent with Stripe
        // For now, we'll just send a mock response
        res.json({
            clientSecret: 'mock_client_secret',
            amount: amount,
            productName: productName,
            vin: vin
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle purchase
app.post('/purchase', (req, res) => {
    const { productId, vin, productName } = req.body;
    
    // Here you would typically process the purchase
    // For now, we'll just send a success response
    res.json({
        success: true,
        message: `Successfully purchased ${productName} with VIN: ${vin}`
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});