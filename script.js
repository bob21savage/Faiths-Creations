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
    loadCart();
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
            
            try {
                const response = await fetch('/create-payment-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        amount: 1000, // Amount in cents
                        productName: productName,
                        productId: productId
                    })
                });

                if (!response.ok) {
                    throw new Error('Payment creation failed');
                }

                const data = await response.json();
                window.location.href = data.url;
            } catch (err) {
                console.error('Payment error:', err);
                alert('An error occurred during payment. Please try again.');
            }
        });
    });
}

// Cart functionality
let cart = [];

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(productId, productName, price) {
    const item = { productId, productName, price };
    cart.push(item);
    saveCart();
    updateCartUI();
    alert(`${productName} added to cart!`);
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }

    // Update cart total if it exists
    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    updateCartUI();
});

console.log('Welcome to the online shop!');
