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

function setupPaymentButton() {
    const stripeKey = localStorage.getItem('stripeKey');
    if (!stripeKey) {
        console.error('Stripe publishable key is missing.');
        return;
    }

    const stripe = Stripe(stripeKey);
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');

    const payButtons = document.querySelectorAll('[id^="payButton"]');
    payButtons.forEach(payButton => {
        payButton.addEventListener('click', async () => {
            const productId = payButton.id.replace('payButton', '');
            const productName = document.querySelector('header h1').innerText;
            const productDescription = document.querySelector('main p').innerText;
            const vin = document.getElementById(`vin${productId}`).value;
            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    amount: 1000, // Amount in cents
                    productName: productName,
                    productDescription: productDescription,
                    vin: vin
                })
            });

            const { clientSecret } = await response.json();

            const { error } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
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
    });
}

function addToCart(productId) {
    const vin = document.getElementById(`vin${productId}`).value;
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push({ productId, vin });
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Product ${productId} added to cart with VIN ${vin}`);
}

function purchaseProduct(productId) {
    const vin = document.getElementById(`vin${productId}`).value;
    fetch('/purchase', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, vin }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Notify the user of the purchase status
    })
    .catch(error => console.error('Error during purchase:', error));
}

function confirmUrl() {
    const facebookUrl = document.getElementById('facebookUrl').value;
    alert("The Facebook URL has been set to: " + facebookUrl);
}

console.log('Welcome to the online shop!');
