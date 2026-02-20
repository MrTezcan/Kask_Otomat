@echo off
cls
echo ===================================================
echo   Fresh-Rider Stil Duzeltme Araci
echo ===================================================
echo.
echo 1. Onbellek (.next klasoru) temizleniyor...
if exist .next rmdir /s /q .next

echo 2. Bagimliliklar (npm install) kontrol ediliyor...
call npm install

echo 3. Uygulama yeniden baslatiliyor...
echo.
echo Lutfen bu pencere acik kalsin. Uygulama "Ready" oldugunda tarayicidan sayfayi yenileyin.
echo.
npm run dev
