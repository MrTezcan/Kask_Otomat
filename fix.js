const fs = require('fs');
const file = 'src/app/register/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
    /const \{ data, error \}\s+email: formData\.email,/g,
    'const { data, error } = await supabase.auth.signUp({\n            email: formData.email,'
);
fs.writeFileSync(file, content, 'utf8');