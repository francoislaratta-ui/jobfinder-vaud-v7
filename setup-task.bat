@echo off
echo Creation de la tache planifiee Indeed Scraper...
schtasks /create /tn "IndeedScraper" /tr "\"C:\Users\Admin\Documents\GitHub\jobfinder-vaud-v7\scraper-local.bat\"" /sc ONSTART /delay 0005:00 /ru "%USERNAME%" /f
echo.
echo Tache creee avec succes !
echo Elle se lancera automatiquement 5 minutes apres le demarrage du PC.
echo.
pause
