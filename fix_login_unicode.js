const fs = require('fs');

// Fix both files
['src/app/user/page.tsx', 'src/app/page.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const before = content;
    content = content.replace(/\\\\u([0-9a-fA-F]{4})/g, (match, hex) => {
        return String.fromCodePoint(parseInt(hex, 16));
    });
    fs.writeFileSync(file, content, 'utf8');
    const changed = before !== content;
    console.log(file + ': ' + (changed ? 'fixed' : 'no changes'));
});
