https://dashboard.render.com/

# Project Dependencies

1. [Stripe.js](https://stripe.com/docs/js) - For handling payments.
2. [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) - For making HTTP requests.
3. [HTML5](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5) - For structuring the web pages.
4. [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) - For adding interactivity to the web pages.

## Setup Instructions

1. Include Stripe.js in your HTML file:
    ```html
    <script src="https://js.stripe.com/v3/"></script>
    ```

2. Ensure you have a server endpoint `/create-payment-intent` to handle payment intent creation.

3. Add the following script to your HTML file to initialize Stripe and handle payments:
    ```html
    <script src="../script.js"></script>
    ```

4. Replace `'your-publishable-key'` with your actual Stripe publishable key in the script file.

## Usage

1. Click on a product link to load the product details.
2. Click on the "Send Money on Facebook" button to initiate the payment process.
3. Follow the prompts to complete the payment.

## Additional Information

For more details, visit the [Stripe documentation](https://stripe.com/docs).

## How to Install Stripe

1. **Sign Up for a Stripe Account**: 
   - Go to the [Stripe website](https://stripe.com) and sign up for an account.

2. **Get Your API Keys**:
   - After signing up, navigate to the Dashboard to get your publishable and secret API keys.

3. **Include Stripe.js in Your Project**:
   - Add the following script tag to your HTML file to include Stripe.js:
     ```html
     <script src="https://js.stripe.com/v3/"></script>
     ```

4. **Install Stripe on Your Server**:
   - If you are using Node.js, you can install the Stripe package using npm:
     ```sh
     npm install stripe
     ```
   - For other server environments, refer to the [Stripe API documentation](https://stripe.com/docs/api) for installation instructions.

5. **Set Up Your Server Endpoint**:
   - Create an endpoint on your server to handle payment intent creation. This endpoint will use your secret API key to create a payment intent and return the client secret to your frontend.

## Installing Node Modules

1. **Initialize Your Project**:
   - If you haven't already, initialize your Node.js project with:
     ```sh
     npm init -y
     ```

2. **Install Required Node Modules**:
   - Install the Stripe package:
     ```sh
     npm install stripe
     ```
   - You may also need to install other packages depending on your server setup, such as Express for handling HTTP requests:
     ```sh
     npm install express
     ```

3. **Create a Server File**:
   - Create a file (e.g., `server.js`) and set up your server to handle payment intents:
     ```javascript
     const express = require('express');
     const stripe = require('stripe')('your-secret-key'); // Replace with your actual Stripe secret key
     const app = express();
     app.use(express.json());

     app.post('/create-payment-intent', async (req, res) => {
         const { amount, productName, productDescription } = req.body;
         const paymentIntent = await stripe.paymentIntents.create({
             amount,
             currency: 'usd',
             metadata: { productName, productDescription }
         });
         res.send({ clientSecret: paymentIntent.client_secret });
     });

     app.listen(3000, () => console.log('Server running on port 3000'));
     ```

4. **Run Your Server**:
   - Start your server with:
     ```sh
     node server.js
     ```