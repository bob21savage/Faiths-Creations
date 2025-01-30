const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { google } = require('googleapis');
require('dotenv').config(); // Load environment variables from .env file

const app = express();

app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Serve other HTML files
app.get('/product/:id', (req, res) => {
    const productId = req.params.id;
    res.sendFile(path.join(__dirname, 'templates', `product${productId}.html`));
});

// Handle email verification
app.post('/send-verification-email', (req, res) => {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;

    // Store the token in a temporary file (for simplicity)
    fs.writeFileSync('verificationToken.txt', verificationToken);

    // Send the verification email
    const transporter = nodemailer.createTransport({
        service: 'Outlook365',
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: process.env.EMAIL_ADDRESS,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: ${verificationLink}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending verification email.');
        }
        res.status(200).send('Verification email sent successfully.');
    });
});

// Handle email verification link
app.get('/verify-email', (req, res) => {
    const token = req.query.token;
    const storedToken = fs.readFileSync('verificationToken.txt', 'utf8');

    if (token === storedToken) {
        fs.unlinkSync('verificationToken.txt'); // Delete the token file
        res.sendFile(path.join(__dirname, 'templates', 'setup.html')); // Serve the setup form
    } else {
        res.status(400).send('Invalid verification token.');
    }
});

// Handle email sign-in verification using OAuth2
app.post('/verify-email-signin', async (req, res) => {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.CLIENT_ID, // Use environment variable for client ID
        process.env.CLIENT_SECRET, // Use environment variable for client secret
        process.env.REDIRECT_URI // Use environment variable for redirect URI
    );

    oAuth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN // Use environment variable for refresh token
    });

    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transporter = nodemailer.createTransport({
            service: 'Outlook365',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_ADDRESS,
                clientId: process.env.CLIENT_ID, // Use environment variable for client ID
                clientSecret: process.env.CLIENT_SECRET, // Use environment variable for client secret
                refreshToken: process.env.REFRESH_TOKEN, // Use environment variable for refresh token
                accessToken: accessToken.token
            }
        });

        transporter.verify((error, success) => {
            if (error) {
                return res.status(500).send('Error verifying email sign-in.');
            }
            res.status(200).send('Email sign-in verified successfully.');
        });
    } catch (error) {
        res.status(500).send('Error verifying email sign-in.');
    }
});

// Handle new product creation
app.post('/create-product', (req, res) => {
    const { name, imageUrl, description, stripeKey } = req.body;
    const productId = Date.now();
    const productPageContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="../styles.css">
            <title>${name}</title>
        </head>
        <body>
            <header>
                <h1>${name}</h1>
            </header>
            <main>
                <img src="${imageUrl}" alt="${name}">
                <p>${description}</p>
                <button id="payButton" onclick="purchaseProduct(${productId})">Send Money on Facebook</button>
                <form id="key-url-form" style="display: none;">
                    <label for="key">Enter Key:</label>
                    <input type="text" id="key" name="key" required>

                    <label for="facebook-url">Enter Facebook URL:</label>
                    <input type="url" id="facebook-url" name="facebook-url" required>

                    <div id="card-element"><!-- A Stripe Element will be inserted here. --></div>
                    <button type="submit">Pay</button>
                </form>

                <div id="result"></div>
            </main>
            <script src="../script.js"></script>
            <script>
                const stripe = Stripe('${stripeKey}');
                const elements = stripe.elements();
                const cardElement = elements.create('card');
                cardElement.mount('#card-element');

                document.getElementById('key-url-form').addEventListener('submit', async function(event) {
                    event.preventDefault();

                    const key = document.getElementById('key').value;
                    const facebookUrl = document.getElementById('facebook-url').value;

                    const response = await fetch('/create-payment-intent', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: 1000 })
                    });
                    const { clientSecret } = await response.json();

                    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                        payment_method: {
                            card: cardElement,
                            billing_details: {
                                name: document.getElementById('key').value,
                            },
                        },
                    });
                });
            </script>
        </body>
        </html>
    `;

    fs.writeFile(path.join(__dirname, 'templates', `product_${productId}.html`), productPageContent, (err) => {
        if (err) {
            return res.status(500).send('Error creating product page.');
        }
        res.status(200).send('Product page created successfully.');
    });
});

// Handle purchase requests and send email notifications
app.post('/purchase', (req, res) => {
    const { productId } = req.body;

    // Set up the email transporter
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // or your email service
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.EMAIL_PASSWORD
        },
    });

    // Email options
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS, // Your email
        to: process.env.EMAIL_ADDRESS, // Send notification to yourself
        subject: 'New Purchase Notification',
        text: `A new purchase has been made for product ID: ${productId}.`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send({ message: 'Error sending email.' });
        }
        res.send({ message: 'Purchase successful! A notification email has been sent to the developer.' });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});