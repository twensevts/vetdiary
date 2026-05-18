// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const authRoutes = require('./routes/authRoutes');
const petRoutes = require('./routes/petRoutes');
const postRoutes = require('./routes/postRoutes');
const careEventRoutes = require('./routes/careEventRoutes');
const petDocumentRoutes = require('./routes/petDocumentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/care-events', careEventRoutes);
app.use('/api/pets', petDocumentRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Документация Swagger доступна по адресу: http://localhost:${PORT}/api-docs`);
});