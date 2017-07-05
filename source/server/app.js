import io from 'socket.io'
import express from 'express'
import http from 'http'
import useIO from './io'
import renderPage from './page'


// Express
const app = express();

// Server
const server = http.createServer(app);

// IO
const socket = io(server);

useIO(socket);
renderPage(app);

server.listen(5000,()=>{
    console.log('server is run');
})