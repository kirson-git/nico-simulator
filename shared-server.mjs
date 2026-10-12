// Public course viewer: static allowlisted assets only. No cluster or shell access.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {staticFiles} from './static-files.mjs';
const files=new Map([...staticFiles].filter(([path])=>!['/app.js','/xterm.js','/xterm.css','/fit.js'].includes(path)));
files.set('/kubernetes',['web/shared-lab.html','text/html']);

export function createSharedServer() {
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'");
  res.setHeader('Cache-Control','no-cache');
  if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  const file=files.get(req.url);
  if(!file) {res.writeHead(404);res.end();return;}
  try {
   const [path,mime]=file;
   let body=await readFile(new URL(path,import.meta.url));
   if(mime==='text/html')body=Buffer.from(body.toString().replace('</head>','<meta name="course-mode" content="shared"></head>'));
   res.writeHead(200,{'Content-Type':mime,'Content-Length':body.length});
   res.end(req.method==='HEAD'?undefined:body);
  } catch {res.writeHead(500);res.end();}
 });
 server.on('upgrade',(_req,socket)=>socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'));
 return server;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 const server=createSharedServer();
 server.listen(3000,'0.0.0.0',()=>console.log('Shared course ready on port 3000; live lab disabled.'));
 process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
}
