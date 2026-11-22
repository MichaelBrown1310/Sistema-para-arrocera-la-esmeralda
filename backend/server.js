const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const ARCHIVO_DATOS = path.join(__dirname, 'data', 'factores.json');

app.use(cors());
app.use(express.json());

function leerFactores() {
  if (!fs.existsSync(ARCHIVO_DATOS)) {
    return [];
  }
  const contenido = fs.readFileSync(ARCHIVO_DATOS, 'utf-8');
  return JSON.parse(contenido);
}

function guardarFactores(factores) {
  fs.writeFileSync(ARCHIVO_DATOS, JSON.stringify(factores, null, 2), 'utf-8');
}

app.get('/api/factores', (req, res) => {
  const factores = leerFactores();
  res.json(factores);
});

app.post('/api/factores', (req, res) => {
  const { categoria, descripcion, tipo, impacto, plazo } = req.body;

  if (!categoria || !descripcion || !tipo || !impacto || !plazo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const factores = leerFactores();
  const nuevoFactor = {
    id: Date.now(),
    categoria,
    descripcion,
    tipo,
    impacto,
    plazo
  };

  factores.push(nuevoFactor);
  guardarFactores(factores);
  res.status(201).json(nuevoFactor);
});

app.delete('/api/factores/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let factores = leerFactores();
  const longitudOriginal = factores.length;
  factores = factores.filter(factor => factor.id !== id);

  if (factores.length === longitudOriginal) {
    return res.status(404).json({ error: 'Factor no encontrado' });
  }

  guardarFactores(factores);
  res.json({ mensaje: 'Factor eliminado correctamente' });
});

app.listen(PORT, () => {
  console.log('Servidor corriendo en el puerto ' + PORT);
});
