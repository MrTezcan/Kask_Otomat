const fs = require("fs");
const path = "web-app/src/app/admin/page.tsx";
let c = fs.readFileSync(path, "utf8");
c = c.replace("        checkAuth()\n        fetchDevices()", "        void checkAuth()\n        fetchDevices()");
fs.writeFileSync(path, c, "utf8");
console.log("done");