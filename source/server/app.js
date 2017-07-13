import io from 'socket.io'
import express from 'express'
import http from 'http'
import useIO from './io'
import renderPage from './page'
import { join } from 'path'


// Express
const app = express();

// Server
const server = http.createServer(app);

// IO
const socket = io(server);

useIO(socket);
renderPage(app);

app.use(express.static(join(__dirname, '../../resource')));

server.listen(5000, () => {
    console.log('server is run');
})