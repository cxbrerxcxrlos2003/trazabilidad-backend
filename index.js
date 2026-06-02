const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// CONFIGURACIÓN DE MIDDLEWARES
app.use(cors()); // Permite que tu index.html se conecte desde tu computadora
app.use(express.json()); // Permite que el servidor entienda datos en formato JSON

// CONFIGURACIÓN DE LA BASE DE DATOS DE AIVEN
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 24140,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ruta raíz de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: "API de Trazabilidad Bovina - Asociación Charolais Activa" });
});

// ==========================================
// 1. ENDPOINTS DE TRAZABILIDAD IOT
// ==========================================

// Obtener todas las tramas de los collares
app.get('/trazabilidad', (req, res) => {
    db.query('SELECT * FROM trazabilidad ORDER BY fecha DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Guardar una nueva trama de GPS/Collar
app.post('/trazabilidad', (req, res) => {
    const { dispositivo_id, bovino_id, latitud, longitud } = req.body;
    const query = 'INSERT INTO trazabilidad (dispositivo_id, bovino_id, latitud, longitud, fecha) VALUES (?, ?, ?, ?, NOW())';
    db.query(query, [dispositivo_id, bovino_id, latitud, longitud], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ mensaje: "Trama de trazabilidad guardada exitosamente" });
    });
});

// ==========================================
// 2. ENDPOINTS DE PROPIETARIOS
// ==========================================

// Obtener lista de ganaderos
app.get('/propietarios', (req, res) => {
    db.query('SELECT * FROM propietarios', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Guardar un nuevo ganadero socio
app.post('/propietarios', (req, res) => {
    const { cedula, nombre, telefono } = req.body;
    const query = 'INSERT INTO propietarios (cedula, nombre, telefono) VALUES (?, ?, ?)';
    db.query(query, [cedula, nombre, telefono], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ mensaje: "Propietario registrado con éxito" });
    });
});

// ==========================================
// 3. ENDPOINTS DE FINCAS
// ==========================================

// Obtener lista de fincas
app.get('/fincas', (req, res) => {
    db.query('SELECT * FROM fincas', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Guardar una nueva finca
app.post('/fincas', (req, res) => {
    const { nombre, ubicacion, propietario_id } = req.body;
    const query = 'INSERT INTO fincas (nombre, ubicacion, propietario_id) VALUES (?, ?, ?)';
    db.query(query, [nombre, ubicacion, propietario_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ mensaje: "Finca registrada con éxito" });
    });
});

// ==========================================
// 4. ENDPOINTS DE VACUNAS (CONTROL SANITARIO)
// ==========================================

// Obtener historial clínico/vacunas
app.get('/vacunas', (req, res) => {
    db.query('SELECT * FROM vacunas ORDER BY fecha_aplicacion DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Guardar aplicación de vacuna
app.post('/vacunas', (req, res) => {
    const { bovino_id, tipo_vacuna, fecha_aplicacion } = req.body;
    const query = 'INSERT INTO vacunas (bovino_id, tipo_vacuna, fecha_aplicacion) VALUES (?, ?, ?)';
    db.query(query, [bovino_id, tipo_vacuna, fecha_aplicacion], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ mensaje: "Historial de vacuna guardado con éxito" });
    });
});

// ENCENDER EL SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});