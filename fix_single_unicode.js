const fs = require('fs');

['src/app/user/page.tsx', 'src/app/page.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let count = 0;
    
    // Replace single-backslash \uXXXX (which appear as  in the file as actual backslash char + uXXXX)
    // In node, reading the file, a literal backslash-u is stored as '\' + 'u'. We search for that pattern.
    const newContent = content.replace(/\u005cu([0-9a-fA-F]{4})/g, (match, hex) => {
        count++;
        return String.fromCodePoint(parseInt(hex, 16));
    });
    
    if (count > 0) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(file + ': replaced ' + count + ' unicode escapes');
    } else {
        console.log(file + ': nothing to fix');
    }
});
