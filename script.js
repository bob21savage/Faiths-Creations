document.addEventListener('DOMContentLoaded', () => {
    const productLinks = document.querySelectorAll('.product-item');
    productLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const url = link.getAttribute('href');
            fetch(url)
                .then(response => response.text())
                .then(html => {
                    document.querySelector('main').innerHTML = html;
                    window.history.pushState({}, '', url);
                    setupPaymentButton();
                })
                .catch(error => console.error('Error loading product:', error));
        });
    });
    setupPaymentButton();

    const productForm = document.getElementById('productForm');
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const facebookUrl = document.getElementById('facebookUrl').value;
        const stripeKey = document.getElementById('stripeKey').value;
        const productCatalog = [];
        for (let i = 1; i <= 200; i++) {
            productCatalog.push({ id: i, name: `Product ${i}`, imageUrl: `${facebookUrl}${i}.jpg`, description: `This is product ${i}`, price: 10.99 });
        }

        const productList = document.getElementById('product-list');
        productCatalog.forEach(product => {
            const productItem = document.createElement('a');
            productItem.href = `product${product.id}.html`;
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div class='product'>
                    <h2>${product.name}</h2>
                    <p>${product.description}</p>
                    <p>Price: ${product.price}</p>
                </div>
            `;
            productList.appendChild(productItem);

            const productPageContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link rel="stylesheet" href="../styles.css">
                    <title>${product.name}</title>
                </head>
                <body>
                    <header>
                        <h1>${product.name}</h1>
                    </header>
                    <main>
                        <img src="${product.imageUrl}" alt="${product.name}">
                        <p>${product.description}</p>
                        <button id="payButton" onclick="purchaseProduct(${product.id})">Send Money on Facebook</button>
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
                        const stripe = Stripe('${stripeKey}'); // Replace with your public key
                        const elements = stripe.elements();
                        const cardElement = elements.create('card');
                        cardElement.mount('#card-element');

                        document.getElementById('key-url-form').addEventListener('submit', async function(event) {
                            event.preventDefault();

                            const key = document.getElementById('key').value;
                            const facebookUrl = document.getElementById('facebook-url').value;

                            // Create a payment intent on the server
                            const response = await fetch('/create-payment-intent', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ amount: 1000 }) // Amount in cents
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
            const blob = new Blob([productPageContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `product${product.id}.html`; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); 
        });
    });

    const newProductForm = document.getElementById('newProductForm');
    newProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productName = document.getElementById('newProductName').value;
        const imageUrl = document.getElementById('newProductImageUrl').value;
        const description = document.getElementById('newProductDescription').value;
        const stripeKey = document.getElementById('newProductStripeKey').value; // Get the Stripe key

        // Send the new product data to the server
        const response = await fetch('/create-product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: productName, imageUrl, description, stripeKey }), // Include Stripe key
        });

        if (response.ok) {
            alert('Product created successfully!');
            // Optionally, refresh the product list or redirect
        } else {
            alert('Error creating product.');
        }
    });

    const products = {};

    for (let i = 1; i <= 200; i++) {
        products[i] = {
            image: `${facebookUrl}${i}.jpg`, // Construct image URL
            description: `Description of Product ${i}.`
        };
    }

    // Initialize Stripe with the publishable key
    const stripe = Stripe(stripeKey);

    // Additional logic for handling product display and purchases

    async function uploadToFacebook(imageUrl, productId) {
        try {
            const response = await fetch('/upload-facebook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl, productId }),
            });
            const result = await response.json();
            console.log('Upload successful:', result);
        } catch (error) {
            console.error('Error uploading to Facebook:', error);
        }
    }

    function setupPaymentButton() {
        const payButton = document.getElementById('payButton');
        if (payButton) {
            payButton.addEventListener('click', async () => {
                const productName = document.querySelector('header h1').innerText;
                const productDescription = document.querySelector('main p').innerText;
                const response = await fetch('/create-payment-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        amount: 1000, // Amount in cents
                        productName: productName,
                        productDescription: productDescription
                    })
                });

                const { clientSecret } = await response.json();

                const { error } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: cardElement, // cardElement is the card input element you create with Stripe.js
                        billing_details: {
                            name: 'Customer Name',
                        },
                    },
                });

                if (error) {
                    alert(error.message);
                } else {
                    alert('Payment successful!');
                }
            });
        }
    }

    document.getElementById('productSelect').addEventListener('change', function() {
        const selectedProduct = this.value;
        if (selectedProduct) {
            const product = products[selectedProduct];
            document.getElementById('productImage').src = product.image;
            document.getElementById('productDescription').innerText = product.description;
            document.getElementById('productDetails').style.display = 'block';
        } else {
            document.getElementById('productDetails').style.display = 'none';
        }
    });

    const productSelect = document.getElementById('productSelect');
    for (let i = 1; i <= 200; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.text = `Product ${i}`;
        productSelect.appendChild(option);
    }

    console.log('Welcome to the online shop!');
});
