const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// The nav was inserted AFTER </div> - we need it before.
// Find pattern: closing root div THEN nav comment
const wrongPattern = '        </div>\n            {/* Mobile Bottom Navigation */}';
const wrongPatternCRLF = '        </div>\r\n            {/* Mobile Bottom Navigation */}';

if (content.includes(wrongPattern)) {
    // Move the nav block before the closing div
    // Find where the nav block ends
    const navEnd = content.indexOf('            </nav>\n', content.indexOf(wrongPattern));
    if (navEnd !== -1) {
        const navEndFull = navEnd + '            </nav>\n'.length;
        const navContent = content.slice(content.indexOf('\n            {/*', content.indexOf(wrongPattern)) + 1, navEndFull);
        // Remove nav from current position
        content = content.replace('\n' + navContent, '');
        // Insert before closing div
        content = content.replace('        </div>\n    )\n}', '        ' + navContent.trimStart() + '        </div>\n    )\n}');
        fs.writeFileSync('src/app/admin/page.tsx', content, 'utf8');
        console.log('Repositioned nav');
    }
} else {
    console.log('Pattern not found, trying simpler fix...');
    // Just find </div> at position matching the last modal closing
    // and insert nav before the very last </div>
    const lines = content.split('\n');
    // Find the line that is exactly '        </div>' followed by the nav comment
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === '        </div>' && lines[i+1] && lines[i+1].includes('Mobile Bottom Navigation')) {
            // Remove this </div>, insert nav, then add </div>
            const navLines = [];
            let j = i + 1;
            while (j < lines.length && !lines[j].startsWith('    )')) {
                navLines.push(lines[j]);
                j++;
            }
            lines.splice(i, j - i, ...navLines, '        </div>');
            fs.writeFileSync('src/app/admin/page.tsx', lines.join('\n'), 'utf8');
            console.log('Fixed by line manipulation');
            break;
        }
    }
}
