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
    updateCartUI();
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
    const cardElementMount = document.getElementById('card-element');
    if (cardElementMount) {
        cardElement.mount('#card-element');
    }

    const payButtons = document.querySelectorAll('[id^="payButton"]');
    payButtons.forEach(payButton => {
        payButton.addEventListener('click', async () => {
            const productId = payButton.id.replace('payButton', '');
            const productName = document.querySelector('header h1').innerText;
            const productDescription = document.querySelector('main p').innerText;
            
            try {
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

                if (!response.ok) {
                    throw new Error('Payment creation failed');
                }

                const { clientSecret } = await response.json();

                const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
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
                    alert('Payment successful! Your order has been placed.');
                    // Optionally redirect to a success page
                    window.location.href = '/payment-success';
                }
            } catch (err) {
                console.error('Payment error:', err);
                alert('An error occurred during payment. Please try again.');
            }
        });
    });
}

// Cart functionality
let cart = [];

function addToCart(productId, productName, price) {
    cart.push({ productId, productName, price });
    updateCartUI();
    alert(`${productName} added to cart!`);
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

async function purchaseProduct(productId, productName, price) {
    try {
        // Create a payment intent
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: price * 100, // Convert to cents
                productName,
                productId
            }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const { sessionId } = await response.json();
        
        // Redirect to Stripe Checkout
        const stripe = Stripe('your_publishable_key'); // Replace with your Stripe publishable key
        const { error } = await stripe.redirectToCheckout({
            sessionId
        });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error processing your purchase. Please try again.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});

console.log('Welcome to the online shop!');
