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
            const vinInput = document.getElementById(`vin${productId}`);
            
            if (!vinInput || !vinInput.value) {
                alert('Please enter a valid VIN number');
                return;
            }
            
            const vin = vinInput.value;
            
            try {
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
                    // Clear the VIN input after successful payment
                    vinInput.value = '';
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

function addToCart(productId) {
    const vinInput = document.getElementById(`vin${productId}`);
    if (!vinInput || !vinInput.value) {
        alert('Please enter a valid VIN number');
        return;
    }
    
    const vin = vinInput.value;
    const productName = document.querySelector('header h1').innerText;
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if item with same VIN already exists in cart
    const existingItem = cart.find(item => item.vin === vin);
    if (existingItem) {
        alert('This VIN is already in your cart');
        return;
    }
    
    cart.push({ 
        productId, 
        vin,
        productName,
        addedAt: new Date().toISOString()
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Product ${productName} added to cart with VIN ${vin}`);
}

function purchaseProduct(productId) {
    const vinInput = document.getElementById(`vin${productId}`);
    if (!vinInput || !vinInput.value) {
        alert('Please enter a valid VIN number');
        return;
    }
    
    const vin = vinInput.value;
    const productName = document.querySelector('header h1').innerText;
    
    fetch('/purchase', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            productId, 
            vin,
            productName 
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Purchase failed');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        vinInput.value = ''; // Clear the VIN input after successful purchase
    })
    .catch(error => {
        console.error('Error during purchase:', error);
        alert('An error occurred during purchase. Please try again.');
    });
}

console.log('Welcome to the online shop!');
