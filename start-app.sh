#!/bin/bash
cd /var/www/stock-management
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
exec npm start
