// app.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Motor de vistas: EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para leer el cuerpo de formularios (application/x-www-form-urlencoded)
// Debe ir ANTES de las rutas, o req.body llegará como undefined
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Express funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});