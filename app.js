const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(express.json());

// Import routes
const bookRoutes = require('./routes/book.routes');
app.use('/api/books', bookRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.get('/', (req, res) => {
    res.send('Welcome to API');
});
app.get('/api/books', (req, res) => {
    res.json({ message: 'List of books' });
});