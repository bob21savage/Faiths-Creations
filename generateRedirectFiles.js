const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'templates');
const productCount = 200;
const catalogFilePath = path.join(outputDir, 'product_catalog.html');

// Function to get image URL for a product
const getProductImageUrl = (productId) => {
    // You can replace these with your actual product image URLs
    const imageUrls = [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff', // Shoes
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30', // Watch
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', // Headphones
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f', // Camera
        'https://images.unsplash.com/photo-1484704849700-f032a6c91349', // Earphones
        'https://images.unsplash.com/photo-1491553895911-0055eca6402d', // Shoes 2
        'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6', // Watch 2
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12', // Headphones 2
    ];
    
    // Cycle through the images
    return imageUrls[productId % imageUrls.length] + '?auto=format&fit=crop&w=400&h=400&q=80';
};

const redirectTemplate = (productId) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../public/styles.css">
    <script src="https://js.stripe.com/v3/"></script>
    <title>Product ${productId}</title>
</head>
<body>
    <header>
        <h1>Product ${productId}</h1>
        <nav>
            <a href="/">Home</a>
            <a href="/catalog">Catalog</a>
        </nav>
    </header>
    <main>
        <div class="product-container">
            <img src="${getProductImageUrl(productId)}" alt="Product ${productId}" class="product-image">
            <div class="product-details">
                <p class="product-description">High-quality product with premium materials and excellent craftsmanship. Perfect for those who appreciate fine details and lasting quality.</p>
                <div class="product-form">
                    <div class="button-group">
                        <button id="addToCartButton${productId}" onclick="addToCart(${productId}, 'Product ${productId}', 10.00)" class="btn btn-secondary">Add to Cart</button>
                        <button id="payButton${productId}" onclick="purchaseProduct(${productId})" class="btn btn-primary">Purchase Now</button>
                    </div>
                </div>
                <div id="card-element" class="card-element"></div>
                <div id="card-errors" class="error-message"></div>
            </div>
        </div>
    </main>
    <script src="../script.js"></script>
</body>
</html>
`;

let catalogContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../public/styles.css">
    <title>Product Catalog</title>
</head>
<body>
    <header>
        <h1>Product Catalog</h1>
        <nav>
            <a href="/">Home</a>
        </nav>
    </header>
    <main>
        <div class="product-grid">
`;

for (let i = 1; i <= productCount; i++) {
    const filePath = path.join(outputDir, `product${i}.html`);
    fs.writeFileSync(filePath, redirectTemplate(i));
    console.log(`Created: ${filePath}`);
    
    catalogContent += `
            <div class="product-card">
                <img src="${getProductImageUrl(i)}" alt="Product ${i}" class="product-thumbnail"/>
                <h3>Product ${i}</h3>
                <a href="/product/${i}" class="btn btn-primary">View Details</a>
            </div>
    `;
}

catalogContent += `
        </div>
    </main>
</body>
</html>
`;

fs.writeFileSync(catalogFilePath, catalogContent);
console.log(`Created: ${catalogFilePath}`);
