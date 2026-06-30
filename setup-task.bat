@echo off
echo Suppression des anciennes taches si presentes...
schtasks /delete /tn "IndeedScraper" /f >nul 2>&1
schtasks /delete /tn "JobFinderScraper_0630" /f >nul 2>&1
schtasks /delete /tn "JobFinderScraper_1200" /f >nul 2>&1
schtasks /delete /tn "JobFinderScraper_1800" /f >nul 2>&1
schtasks /delete /tn "JobFinderScraper_0600" /f >nul 2>&1
schtasks /delete /tn "JobFinderScraper_0800" /f >nul 2>&1
schtasks /delete /tn "JobFinderScraper_1000" /f >nul 2>&1
schtasks /delete /tn "JobFinderScraper_1400" /f >nul 2>&1
schtasks /delete /tn "JobFinderScraper_1600" /f >nul 2>&1
schtasks /delete /tn "JobFinderScraper_2000" /f >nul 2>&1
schtasks /delete /tn "JobFinderScraper_Startup" /f >nul 2>&1

echo Creation des taches planifiees...

schtasks /create /tn "JobFinderScraper_0600" /tr "\"C:\Users\Admin\Documents\GitHub\jobfinder-vaud-v7\scraper-local.bat\"" /sc DAILY /st 06:00 /ru "%USERNAME%" /f
schtasks /create /tn "JobFinderScraper_0800" /tr "\"C:\Users\Admin\Documents\GitHub\jobfinder-vaud-v7\scraper-local.bat\"" /sc DAILY /st 08:00 /ru "%USERNAME%" /f
schtasks /create /tn "JobFinderScraper_1000" /tr "\"C:\Users\Admin\Documents\GitHub\jobfinder-vaud-v7\scraper-local.bat\"" /sc DAILY /st 10:00 /ru "%USERNAME%" /f
schtasks /create /tn "JobFinderScraper_1200" /tr "\"C:\Users\Admin\Documents\GitHub\jobfinder-vaud-v7\scraper-local.bat\"" /sc DAILY /st 12:00 /ru "%USERNAME%" /f
schtasks /create /tn "JobFinderScraper_1400" /tr "\"C:\Users\Admin\Documents\GitHub\jobfinder-vaud-v7\scraper-local.bat\"" /sc DAILY /st 14:00 /ru "%USERNAME%" /f
schtasks /create /tn "JobFinderScraper_1600" /tr "\"C:\Users\Admin\Documents\GitHub\jobfinder-vaud-v7\scraper-local.bat\"" /sc DAILY /st 16:00 /ru "%USERNAME%" /f
schtasks /create /tn "JobFinderScraper_1800" /tr "\"C:\Users\Admin\Documents\GitHub\jobfinder-vaud-v7\scraper-local.bat\"" /sc DAILY /st 18:00 /ru "%USERNAME%" /f
schtasks /create /tn "JobFinderScraper_2000" /tr "\"C:\Users\Admin\Documents\GitHub\jobfinder-vaud-v7\scraper-local.bat\"" /sc DAILY /st 20:00 /ru "%USERNAME%" /f
schtasks /create /tn "JobFinderScraper_Startup" /tr "\"C:\Users\Admin\Documents\GitHub\jobfinder-vaud-v7\scraper-local.bat\"" /sc ONSTART /delay 0002:00 /ru "%USERNAME%" /f

echo.
echo 9 taches creees avec succes !
echo Le scraper se lancera automatiquement a :
echo   06:00 / 08:00 / 10:00 / 12:00 / 14:00 / 16:00 / 18:00 / 20:00
echo   et 2 minutes apres chaque demarrage du PC
echo.
pause