const fs = require('fs');
const file = 'src/app/user/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace all literal \uXXXX sequences with actual Unicode characters
content = content.replace(/\\\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCodePoint(parseInt(hex, 16));
});

fs.writeFileSync(file, content, 'utf8');
console.log('Done - all \\uXXXX replaced with real chars');
