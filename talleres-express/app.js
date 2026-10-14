import path from "node:path";
import express from "express";
import { talleres, inscripciones } from "./data/datos.js";
import {
  obtenerPlazasRestantes,
  obtenerEstadoTaller,
  parsearId,
  normalizarInscripcion,
  estaInscrito,
  validarInscripcion,
  siguienteId,
} from "./utils/talleres.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

// Convierte el cuerpo de los formularios HTML (application/x-www-form-urlencoded)
// en req.body. Debe registrarse antes de las rutas que lean req.body.
app.use(express.urlencoded({ extended: false }));

// Un filtro de texto solo vale si llega como string. Si llega un array
// (?categoria=web&categoria=sistemas) o un objeto, se ignora el filtro.
function leerFiltroTexto(valor) {
  return typeof valor === "string" ? valor.trim().toLocaleLowerCase("es") : "";
}

// Valida el :id de la URL y busca el taller.
// Devuelve { taller } si todo va bien, o { status, mensaje } si no.
function buscarTallerDeLaUrl(valorId) {
  const id = parsearId(valorId);
  if (id === null) {
    return { status: 400, mensaje: "Identificador de taller no válido" };
  }
  const taller = talleres.find((t) => t.id === id);
  if (!taller) {
    return { status: 404, mensaje: "Taller no encontrado" };
  }
  return { taller };
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

app.get("/talleres/:id/inscripcion", (req, res) => {
  const { taller, status, mensaje } = buscarTallerDeLaUrl(req.params.id);
  if (!taller) {
    return res.status(status).send(mensaje);
  }

  const plazasRestantes = obtenerPlazasRestantes(taller, inscripciones);
  if (obtenerEstadoTaller(plazasRestantes) === "completo") {
    return res.status(409).send("Este taller está completo: no quedan plazas");
  }

  return res.render("inscripcion", {
    tituloPagina: `Inscripción: ${taller.titulo}`,
    taller,
    errores: {},
    valores: {},
  });
});

app.post("/talleres/:id/inscripcion", (req, res) => {
  const { taller, status, mensaje } = buscarTallerDeLaUrl(req.params.id);
  if (!taller) {
    return res.status(status).send(mensaje);
  }

  const plazasRestantes = obtenerPlazasRestantes(taller, inscripciones);
  if (obtenerEstadoTaller(plazasRestantes) === "completo") {
    return res.status(409).send("Este taller está completo: no quedan plazas");
  }

  const valores = normalizarInscripcion(req.body);
  const errores = validarInscripcion(req.body);

  if (!errores.email && estaInscrito(taller.id, valores.email, inscripciones)) {
    errores.email = "Ese correo ya está inscrito en este taller";
  }

  if (Object.keys(errores).length > 0) {
    return res.status(400).render("inscripcion", {
      tituloPagina: `Inscripción: ${taller.titulo}`,
      taller,
      errores,
      valores,
    });
  }

  inscripciones.push({
    id: siguienteId(inscripciones),
    tallerId: taller.id,
    nombre: valores.nombre,
    email: valores.email,
  });

  return res.redirect(303, `/talleres/${taller.id}`);
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
