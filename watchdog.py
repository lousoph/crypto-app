import subprocess
import time
import requests

def is_server_up():
    try:
        r = requests.get('http://localhost:3000/', timeout=5)
        return r.status_code == 200
    except:
        return False

def start_server():
    subprocess.Popen(
        ['node', '-e',
         'const{createServer}=require("http");const next=require("next");'
         'const app=next({dev:false,hostname:"0.0.0.0",port:3000});'
         'const handle=app.getRequestHandler();'
         'app.prepare().then(()=>{createServer(handle).listen(3000,"0.0.0.0",()=>console.log("READY"));'
         '}).catch(e=>{console.error(e.message);process.exit(1);});'],
        cwd='/home/z/my-project',
        env={'NODE_ENV': 'production', 'NODE_OPTIONS': '--max-old-space-size=128', 'PATH': '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/z/.local/bin'},
        stdout=open('/tmp/cf-watchdog.log', 'a'),
        stderr=subprocess.STDOUT
    )

while True:
    if not is_server_up():
        print(f"[{time.strftime('%H:%M:%S')}] Server down, starting...")
        start_server()
        time.sleep(8)
        if is_server_up():
            print(f"[{time.strftime('%H:%M:%S')}] Server started successfully")
        else:
            print(f"[{time.strftime('%H:%M:%S')}] Server failed to start")
    time.sleep(10)
