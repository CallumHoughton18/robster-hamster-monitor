#!/bin/sh

node ./discord-bot/build/main.js &
node ./image-publisher/build/main.js & 
node ./image-s3-storage/build/main.js & 
node ./twitter-bot/build/main.js & 

# Wait for any process to exit
wait -n
  
# Exit with status of process that exited first
exit $?
