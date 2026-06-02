const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path'); // <-- Requerido para manejar rutas de archivos
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// CONFIGURACIÓN DE MIDDLEWARES
app.use(cors()); 
app.use(express.json()); 

// 🌟 ESTA LÍNEA HACE LA MAGIA: 
// Le dice a tu arquitectura que sirva de forma automática el index.html de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

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

// SCRIPT AUTOMÁTICO PARA CREAR LAS TABLAS EN AIVEN
const verificarYCrearTablas = () => {
    const queryPropietarios = `
        CREATE TABLE IF NOT EXISTS propietarios (
            cedula VARCHAR(20) PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            telefono VARCHAR(20)
        );
    `;
    const queryFincas = `
        CREATE TABLE IF NOT EXISTS fincas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            ubicacion VARCHAR(100) NOT NULL,
            propietario_id VARCHAR(20)
        );
    `;
    const queryTrazabilidad = `
        CREATE TABLE IF NOT EXISTS trazabilidad (
            id INT AUTO_INCREMENT PRIMARY KEY,
            dispositivo_id VARCHAR(50) NOT NULL,
            bovino_id VARCHAR(50) NOT NULL,
            latitud DOUBLE NOT NULL,
            longitud DOUBLE NOT NULL,
            fecha DATETIME
        );
    `;
    const queryVacunas = `
        CREATE TABLE IF NOT EXISTS vacunas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bovino_id VARCHAR(50) NOT NULL,
            tipo_vacuna VARCHAR(100) NOT NULL,
            fecha_aplicacion DATE NOT NULL
        );
    `;

    db.query(queryPropietarios, (err) => {
        if (err) console.log("Error creando tabla propietarios:", err.message);
        db.query(queryFincas, (err) => {
            if (err) console.log("Error creando tabla fincas:", err.message);
            db.query(queryTrazabilidad, (err) => {
                if (err) console.log("Error creando tabla trazabilidad:", err.message);
                db.query(queryVacunas, (err) => {
                    if (err) console.log("Error creando tabla vacunas:", err.message);
                    console.log("👉 Verificación de tablas en Aiven completada con éxito.");
                });
            });
        });
    });
};

// Ejecutar la verificación al encender el backend
verificarYCrearTablas();

// ==========================================
// 1. ENDPOINTS DE TRAZABILIDAD IOT
// ==========================================
app.get('/trazabilidad', (req, res) => {
    db.query('SELECT * FROM trazabilidad ORDER BY fecha DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

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
app.get('/propietarios', (req, res) => {
    db.query('SELECT * FROM propietarios', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

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
app.get('/fincas', (req, res) => {
    db.query('SELECT * FROM fincas', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/fincas', (req, res) => {
    const { nombre, ubicacion, propietario_id } = req.body;
    const query = 'INSERT INTO fincas (nombre, ubicacion, propietario_id) VALUES (?, ?, ?)';
    db.query(query, [nombre, ubicacion, propietario_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ mensaje: "Finca registrada con éxito" });
    });
});

// ==========================================
// 4. ENDPOINTS DE VACUNAS
// ==========================================
app.get('/vacunas', (req, res) => {
    db.query('SELECT * FROM vacunas ORDER BY fecha_aplicacion DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/vacunas', (req, res) => {
    const { bovino_id, tipo_vacuna, fecha_aplicacion } = req.body;
    const query = 'INSERT INTO vacunas (bovino_id, tipo_vacuna, fecha_aplicacion) VALUES (?, ?, ?)';
    db.query(query, [bovino_id, tipo_vacuna, fecha_aplicacion], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ mensaje: "Historial de vacuna guardado con éxito" });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});