const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'alberca'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conexión a MySQL establecida...');
});

// Configuración de Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Documentación de la API',
            version: '1.0.0',
            description: 'Documentación de la API con Swagger',
            contact: {
                name: 'Desarrollador',
                email: 'developer@example.com'
            },
            servers: [
                {
                    url: 'http://localhost:5000',
                    description: 'Servidor de desarrollo'
                }
            ]
        }
    },
    apis: ['./server.js'], // Ruta a los documentos de la API
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - nombre
 *         - correo
 *         - contrasena
 *       properties:
 *         id:
 *           type: integer
 *           description: El ID autogenerado del usuario
 *         nombre:
 *           type: string
 *           description: El nombre del usuario
 *         correo:
 *           type: string
 *           description: El correo electrónico del usuario
 *         contrasena:
 *           type: string
 *           description: La contraseña del usuario
 *       example:
 *         id: 1
 *         nombre: Juan Perez
 *         correo: juan.perez@example.com
 *         contrasena: securePassword
 */

/**
 * @swagger
 * /updateProfile:
 *   put:
 *     summary: Actualizar el perfil del usuario
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       200:
 *         description: Perfil actualizado con éxito
 *       500:
 *         description: Error del servidor
 */
app.put('/updateProfile', (req, res) => {
    const { id, nombre, correo, contrasena } = req.body;
    const query = 'UPDATE usuarios SET nombre = ?, correo = ?, contrasena = ? WHERE id = ?';
    db.query(query, [nombre, correo, contrasena, id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json({ success: true, message: 'Perfil actualizado con éxito!' });
        }
    });
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión del usuario
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contrasena
 *             properties:
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       500:
 *         description: Error del servidor
 *       401:
 *         description: Credenciales inválidas
 */
app.post('/login', (req, res) => {
    const { correo, contrasena } = req.body;
    const query = 'SELECT * FROM usuarios WHERE correo = ? AND contrasena = ?';
    db.query(query, [correo, contrasena], (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else if (results.length > 0) {
            res.json({ success: true, user: results[0], message: 'Inicio de sesión exitoso!' });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales inválidas!' });
        }
    });
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Usuario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - contrasena
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario registrado con éxito
 *       500:
 *         description: Error del servidor
 */
app.post('/register', (req, res) => {
    const { nombre, correo, contrasena } = req.body;
    const query = 'INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)';
    db.query(query, [nombre, correo, contrasena], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            const newUserQuery = 'SELECT * FROM usuarios WHERE id = ?';
            db.query(newUserQuery, [result.insertId], (err, results) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.json({ success: true, user: results[0], message: 'Usuario registrado con éxito!' });
                }
            });
        }
    });
});

/**
 * @swagger
 * /ph-levels:
 *   get:
 *     summary: Obtener niveles de pH
 *     tags: [Niveles]
 *     responses:
 *       200:
 *         description: Lista de niveles de pH
 *       500:
 *         description: Error del servidor
 */
app.get('/ph-levels', (req, res) => {
    const usuario_id = req.query.usuario_id;
    const query = `
        SELECT pl.* FROM ph_levels pl
        JOIN albercas a ON pl.alberca_id = a.id
        WHERE a.usuario_id = ?
    `;
    db.query(query, [usuario_id], (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

/**
 * @swagger
 * /temperature-levels:
 *   get:
 *     summary: Obtener niveles de temperatura
 *     tags: [Niveles]
 *     responses:
 *       200:
 *         description: Lista de niveles de temperatura
 *       500:
 *         description: Error del servidor
 */
app.get('/temperature-levels', (req, res) => {
    const usuario_id = req.query.usuario_id;
    const query = `
        SELECT tl.* FROM temperature_levels tl
        JOIN albercas a ON tl.alberca_id = a.id
        WHERE a.usuario_id = ?
    `;
    db.query(query, [usuario_id], (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

/**
 * @swagger
 * /orp-levels:
 *   get:
 *     summary: Obtener niveles de ORP
 *     tags: [Niveles]
 *     responses:
 *       200:
 *         description: Lista de niveles de ORP
 *       500:
 *         description: Error del servidor
 */
app.get('/orp-levels', (req, res) => {
    const usuario_id = req.query.usuario_id;
    const query = `
        SELECT ol.* FROM orp_levels ol
        JOIN albercas a ON ol.alberca_id = a.id
        WHERE a.usuario_id = ?
    `;
    db.query(query, [usuario_id], (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

/**
 * @swagger
 * /latest-temperature:
 *   get:
 *     summary: Obtener la última temperatura
 *     tags: [Niveles]
 *     responses:
 *       200:
 *         description: Última temperatura
 *       500:
 *         description: Error del servidor
 */
app.get('/latest-temperature', (req, res) => {
    const usuario_id = req.query.usuario_id;
    const query = `
        SELECT tl.temperature, tl.date FROM temperature_levels tl
        JOIN albercas a ON tl.alberca_id = a.id
        WHERE a.usuario_id = ?
        ORDER BY tl.date DESC
        LIMIT 1
    `;
    db.query(query, [usuario_id], (err, result) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(result[0]);
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
