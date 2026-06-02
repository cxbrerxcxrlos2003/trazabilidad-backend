const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();

// Middleware para permitir que Vercel se conecte (CORS) y leer datos JSON
app.use(cors());
app.use(express.json());

// Configuración de la conexión a Aiven MySQL usando las variables del archivo .env
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false // Requerido por Aiven para conexiones SSL seguras
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ruta 1: Prueba básica del servidor
app.get('/', (req, res) => {
    res.json({ mensaje: "API de Trazabilidad Bovina funcionando correctamente" });
});

// Ruta 2: Prueba de conexión real con Aiven MySQL
app.get('/test-db', (req, res) => {
    pool.query('SELECT 1 + 1 AS resultado', (err, results) => {
        if (err) {
            console.error("Error al conectar a Aiven:", err);
            return res.status(500).json({ error: "No se pudo conectar a la base de datos", detalle: err.message });
        }
        res.json({ 
            mensaje: "¡Conexión exitosa a Aiven MySQL!", 
            resultado: results[0].resultado 
        });
    });
});

// El puerto lo asignará Render dinámicamente en producción, localmente usa el 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});