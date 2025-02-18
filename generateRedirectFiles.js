const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'templates');
const productCount = 200;
const catalogFilePath = path.join(outputDir, 'product_catalog.html');
const redirectTemplate = (productId) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../styles.css">
    <title>Product ${productId}</title>
</head>
<body>
    <header>
        <h1>Product ${productId}</h1>
    </header>
    <main>
        <img src="https://example.com/images/${productId}.jpg" alt="Product ${productId}">
        <p>Description of Product ${productId}.</p>
        <label for="vin">Enter VIN:</label>
        <input type="text" id="vin${productId}" name="vin" required>
        <button id="addToCartButton${productId}" onclick="addToCart(${productId})">Add to Cart</button>
        <button id="payButton${productId}" onclick="purchaseProduct(${productId})">Purchase</button>
    </main>
    <script src="../script.js"></script>
</body>
</html>
`;

let catalogContent = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Product Catalog</title>\n</head>\n<body>\n    <h1>Product Catalog</h1>\n    <ul>';

for (let i = 1; i <= productCount; i++) {
    const filePath = path.join(outputDir, `product${i}.html`);
    fs.writeFileSync(filePath, redirectTemplate(i));
    console.log(`Created: ${filePath}`);
    const productContent = fs.readFileSync(filePath, 'utf8');
    const facebookUrlMatch = productContent.match(/<button id="payButton\d+" onclick="purchaseProduct\(\d+\)">.*?\s*(https?:\/\/facebook\.com\/[^\s]+)\s*<\/button>/);
    const facebookUrl = facebookUrlMatch ? facebookUrlMatch[1] : '#';
    const imageUrlMatch = productContent.match(/<img src="(https?:\/\/[^\s]+)"/);
    const imageUrl = imageUrlMatch ? imageUrlMatch[1] : 'https://example.com/default.jpg';
    catalogContent += `    <li><a href="product.html">Product ${i}</a> <img src="${imageUrl}" alt="Product ${i}"/> - <a href="${facebookUrl}">Facebook Link</a></li>\n`;
}

catalogContent += '    </ul>\n</body>\n</html>';

fs.writeFileSync(catalogFilePath, catalogContent);
console.log('Product catalog with images generated successfully!');
