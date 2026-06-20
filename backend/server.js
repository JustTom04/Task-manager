const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
// cors() allows cross-origin requests from the React frontend
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'X-User-ID', 'Authorization']
})); 
// express.json() parses incoming JSON payloads
app.use(express.json()); 
// Trigger nodemon restart after Prisma generate

// Import routes
const taskRoutes = require('./routes/tasks');
const labelRoutes = require('./routes/labels');
const projectRoutes = require('./routes/projects');
const authenticateUser = require('./middleware/auth');

// Use routes
app.use('/api/tasks', authenticateUser, taskRoutes);
app.use('/api/labels', authenticateUser, labelRoutes);
app.use('/api/projects', authenticateUser, projectRoutes);

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
