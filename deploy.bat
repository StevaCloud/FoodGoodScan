ssh root@165.22.8.129 "cd /var/www/foodgoodscan && git pull && cd server && npm install && pm2 restart all && pm2 logs --lines 20 --nostream"
pause
