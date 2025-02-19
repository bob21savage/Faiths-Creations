const express = require('express');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf
    }
}));

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// Serve HTML files
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

// Create a Stripe checkout session
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, productName, productId } = req.body;
        
        // Create Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: productName,
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/cancel`,
            shipping_address_collection: {
                allowed_countries: ['US'], // Add other countries as needed
            },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 500, // $5.00
                            currency: 'usd',
                        },
                        display_name: 'Standard shipping',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 5,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 7,
                            },
                        },
                    },
                },
            ],
            metadata: {
                productId: productId,
                productName: productName
            }
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint to handle Stripe events
app.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Get customer details
        const customer = {
            email: session.customer_details.email,
            name: session.customer_details.name,
            shipping: session.shipping_details,
            amount: session.amount_total,
            orderId: session.id,
            productId: session.metadata.productId, // Get productId from metadata
            productName: session.metadata.productName // Get productName from metadata
        };

        // Save order to JSON file
        const ordersFile = path.join(__dirname, 'orders.json');
        let orders = [];
        if (fs.existsSync(ordersFile)) {
            orders = JSON.parse(fs.readFileSync(ordersFile));
        }
        orders.push({
            ...customer,
            orderDate: new Date().toISOString()
        });
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

        // Send email to shop owner
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.SHOP_EMAIL,
            subject: `New Order from ${customer.name}`,
            html: `
                <h1>New Order Received!</h1>
                <h2>Order Details:</h2>
                <p><strong>Order ID:</strong> ${customer.orderId}</p>
                <p><strong>Product ID:</strong> ${customer.productId}</p>
                <p><strong>Product Name:</strong> ${customer.productName}</p>
                <p><strong>Customer Name:</strong> ${customer.name}</p>
                <p><strong>Customer Email:</strong> ${customer.email}</p>
                <h3>Shipping Address:</h3>
                <p>${customer.shipping.address.line1}</p>
                <p>${customer.shipping.address.line2 || ''}</p>
                <p>${customer.shipping.address.city}, ${customer.shipping.address.state} ${customer.shipping.address.postal_code}</p>
                <p>${customer.shipping.address.country}</p>
                <h3>Order Total:</h3>
                <p>$${(customer.amount / 100).toFixed(2)}</p>
            `
        };

        // Send confirmation email to customer
        const customerMailOptions = {
            from: process.env.EMAIL_USER,
            to: customer.email,
            subject: 'Order Confirmation - Faith\'s Creations',
            html: `
                <h1>Thank you for your order!</h1>
                <p>We've received your order and will process it shortly.</p>
                <h2>Order Details:</h2>
                <p><strong>Order ID:</strong> ${customer.orderId}</p>
                <p><strong>Product:</strong> ${customer.productName} (ID: ${customer.productId})</p>
                <h3>Shipping Address:</h3>
                <p>${customer.shipping.address.line1}</p>
                <p>${customer.shipping.address.line2 || ''}</p>
                <p>${customer.shipping.address.city}, ${customer.shipping.address.state} ${customer.shipping.address.postal_code}</p>
                <p>${customer.shipping.address.country}</p>
                <h3>Order Total:</h3>
                <p>$${(customer.amount / 100).toFixed(2)}</p>
                <p>You'll receive another email when your order ships.</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            await transporter.sendMail(customerMailOptions);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    res.json({ received: true });
});

// Success route
app.get('/success', async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.sendFile(path.join(__dirname, 'templates', 'success.html'));
});

// Cancel route
app.get('/cancel', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'cancel.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});