import express from "express";
import { talleres, inscripciones } from "./data/datos.js";
import { obtenerPlazasRestantes, obtenerEstadoTaller, parsearId, } from "./utils/talleres.js";


const app = express();
const PORT = process.env.PORT ?? 3000;

app.set("view engine", "ejs");
app.set("views", "views");


// Un filtro de texto solo vale si llega como string. Si llega un array
// (?categoria=web&categoria=sistemas) o un objeto, se ignora el filtro.
function leerFiltroTexto(valor) {
  return typeof valor === "string" ? valor.trim().toLocaleLowerCase("es") : "";
}

app.get("/talleres", (req, res) => {
  const categoria = leerFiltroTexto(req.query.categoria);
  const nivel = leerFiltroTexto(req.query.nivel);
  // Solo el texto exacto "true" activa el filtro; "false", "xyz" o un array no lo activan.
  const soloDisponibles = req.query.disponibles === "true";

  // map() crea un array nuevo: los objetos originales de datos.js no se modifican.
  const conPlazas = talleres.map((taller) => ({
    ...taller,
    plazasRestantes: obtenerPlazasRestantes(taller, inscripciones),
  }));

  // Filtros acumulativos: cada uno es opcional y se aplica sobre el resultado anterior.
  let resultado = conPlazas;
  if (categoria) {
    resultado = resultado.filter((taller) => taller.categoria === categoria);
  }
  if (nivel) {
    resultado = resultado.filter((taller) => taller.nivel === nivel);
  }
  if (soloDisponibles) {
    resultado = resultado.filter((taller) => taller.plazasRestantes > 0);
  }

  return res.json(resultado);
});

app.get("/talleres/:id", (req, res) => {
  const id = parsearId(req.params.id);
  if (id === null) {
    return res.status(400).send("Identificador de taller no válido");
  }

  const taller = talleres.find((t) => t.id === id);
  if (!taller) {
    return res.status(404).send("Taller no encontrado");
  }

  const plazasRestantes = obtenerPlazasRestantes(taller, inscripciones);
  const estado = obtenerEstadoTaller(plazasRestantes);

  return res.render("taller", {
    tituloPagina: taller.titulo,
    taller,
    plazasRestantes,
    estado,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
