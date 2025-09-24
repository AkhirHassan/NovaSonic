import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Nova Sonic server is running'
    });
});

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.emit('message', 'Connected to Nova Sonic server');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server shut down');
        process.exit(0);
    });
});