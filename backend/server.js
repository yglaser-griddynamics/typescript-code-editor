import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import setupWSConnection from 'y-websocket/bin/utils.js';

const PORT = 1234;

const server = http.createServer((req, res) => {
	res.writeHead(200);
	res.end('OK');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	const room = url.searchParams.get('room') || 'default';

	console.log('Client joined room:', room);

	setupWSConnection(ws, req, { docName: room });
});

server.listen(PORT, () => {
	console.log(`Yjs WebSocket server running on port ${PORT}`);
});
