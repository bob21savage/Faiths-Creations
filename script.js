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

// Initialize Stripe - replace with your publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_publishable_key';
let stripe;

try {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
} catch (error) {
    console.error('Failed to initialize Stripe:', error);
    // Show a user-friendly error message
    alert('Payment system is currently unavailable. Please try again later.');
}

function setupPaymentButton() {
    const payButtons = document.querySelectorAll('[id^="payButton"]');
    payButtons.forEach(payButton => {
        payButton.addEventListener('click', async (event) => {
            event.preventDefault();
            const productId = payButton.id.replace('payButton', '');
            purchaseProduct(productId);
        });
    });
}

async function purchaseProduct(productId) {
    if (!stripe) {
        alert('Payment system is not available. Please try again later.');
        return;
    }

    try {
        const productName = document.querySelector('header h1').innerText;
        console.log('Starting checkout for:', {
            productId,
            productName
        });

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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Payment creation failed');
        }

        const { sessionId } = await response.json();
        console.log('Got session ID:', sessionId);
        
        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: sessionId
        });

        if (result.error) {
            throw new Error(result.error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error processing your purchase: ' + error.message);
    }
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
