const fs = require('fs');
const nav = fs.readFileSync('mobile_nav_snippet.txt', 'utf8');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// Find the last </div> right before ) and }
// We'll look for "        </div>" followed by newline, then "    )" then newline then "}"
// Try with CRLF
let idx = content.lastIndexOf('        </div>\r\n    )\r\n}');
let eol = '\r\n';
if (idx === -1) {
    idx = content.lastIndexOf('        </div>\n    )\n}');
    eol = '\n';
}
if (idx === -1) {
    console.log('Not found. Last 200 chars:', JSON.stringify(content.slice(-200)));
    process.exit(1);
}
const before = content.slice(0, idx + ('        </div>' + eol).length);
const after = content.slice(idx + ('        </div>' + eol).length);
content = before + nav + eol + '    )' + eol + '}' + eol;
fs.writeFileSync('src/app/admin/page.tsx', content, 'utf8');
console.log('Inserted at offset ' + idx);
