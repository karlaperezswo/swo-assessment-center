@echo off
echo Creating sample Excel file for testing...
cd test-data
call npm install xlsx
call node create-sample-excel.js
echo.
echo Sample file created: test-data\sample-mpa-export.xlsx
echo You can use this file to test the application.
pause
