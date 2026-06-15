const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware configuration
// cors() allows cross-origin requests from the React frontend
app.use(cors()); 
// express.json() parses incoming JSON payloads
app.use(express.json()); 

// Import routes
const taskRoutes = require('./routes/tasks');

// Use routes
app.use('/api/tasks', taskRoutes);

// Base route for API health check
app.get('/', (req, res) => {
    res.send('Task Manager API is running...');
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(`🚀 Server is running successfully!`);
    console.log(`📡 API is live at: http://localhost:${PORT}`);
    console.log(`========================================================\n`);
});
