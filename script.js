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
});

const productForm = document.getElementById('productForm');
productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const facebookUrl = document.getElementById('facebookUrl').value;
    const stripeKey = document.getElementById('stripeKey').value;
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
});

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
