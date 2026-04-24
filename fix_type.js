const fs = require("fs");
let content = fs.readFileSync("src/app/user/page.tsx", "utf8");

// Check current Device type
const match = content.match(/type Device = \{[\s\S]*?\}/);
if (match) console.log("Current Device type:", match[0]);

// Fix Device type - add hizmet_fiyati if not present
if (!content.includes("hizmet_fiyati: number")) {
    // Replace the status line to add hizmet_fiyati after it
    content = content.replace(
        "status: 'online' | 'offline' | 'maintenance'\n}",
        "status: 'online' | 'offline' | 'maintenance'\n    hizmet_fiyati: number\n}"
    );
    fs.writeFileSync("src/app/user/page.tsx", content, "utf8");
    console.log("Fixed: added hizmet_fiyati to Device type");
} else {
    console.log("Already has hizmet_fiyati");
}