const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'templates');
const redirectTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url='product.html'" />
    <title>Redirecting...</title>
</head>
<body>
    <p>If you are not redirected, <a href="product.html">click here</a>.</p>
</body>
</html>
`;

for (let i = 35; i <= 200; i++) {
    const filePath = path.join(outputDir, `product${i}.html`);
    fs.writeFileSync(filePath, redirectTemplate);
    console.log(`Created: ${filePath}`);
}
