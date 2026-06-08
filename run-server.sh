#!/bin/bash
cd /home/z/my-project
exec NODE_ENV=production NODE_OPTIONS="--max-old-space-size=384" node node_modules/.bin/next start -H 0.0.0.0 -p 3000
