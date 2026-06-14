const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware (Ezek kötelezőek)
app.use(cors()); // Engedélyezi, hogy a Vite (React) szervere szóba álljon ezzel a szerverrel
app.use(express.json()); // Engedélyezi, hogy az Express megértse a React által küldött JSON adatokat

// Alap "Hello World" végpont a teszteléshez
// Import routes
const taskRoutes = require('./routes/tasks');

// Use routes
app.use('/api/tasks', taskRoutes);

// Base route for testing
app.get('/', (req, res) => {
    res.send('Task Manager API is running...');
});

// Start the server
app.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(`🚀 Server is running successfully!`);
    console.log(`📡 API is live at: http://localhost:${PORT}`);
    console.log(`========================================================\n`);
});
