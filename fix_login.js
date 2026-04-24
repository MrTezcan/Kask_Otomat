const fs = require("fs");

// ===== FIX 1: Login page - fix Turkish characters =====
let login = fs.readFileSync("src/app/page.tsx", "utf8");

login = login.replace(
    "Beni Hat\u00efr la",
    "Beni Hat\u0131rla"
).replace(
    /Beni Hat.rla/,
    "Beni Hat\u0131rla"
).replace(
    /\u00d6ifremi Unuttum|.ifremi Unuttum/,
    "\u015eifremi Unuttum"
).replace(
    /Giri. Yap/,
    "Giri\u015f Yap"
).replace(
    /Hesab.n.z yok mu\? Kay.t Olun/,
    "Hesab\u0131n\u0131z yok mu? Kay\u0131t Olun"
).replace(
    /Mobil Uygulamay. .ndir/,
    "Mobil Uygulama\u0131 \u0130ndir"
).replace(
    /T.m haklar. sakl.d.r/,
    "T\u00fcm haklar\u0131 sakl\u0131d\u0131r"
).replace(
    /ba.ar.l./g,
    "ba\u015far\u0131l\u0131"
).replace(
    /Y.ksek Teknoloji Kask/g,
    "Y\u00fcksek Teknoloji Kask"
).replace(
    /Y.netim Paneli/g,
    "Y\u00f6netim Paneli"
);

// Aggressively replace all the corrupt ? and ? characters in hardcoded Turkish strings
const fixes = [
    ["Beni Hat\\u0131rla", "Beni Hat\u0131rla"],
    ["\u015eifremi Unuttum", "\u015eifremi Unuttum"],
    ["Giri\u015f Yap", "Giri\u015f Yap"],
];

fs.writeFileSync("src/app/page.tsx", login, "utf8");

console.log("Login page done");