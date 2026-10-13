// Colecciones en memoria. Se cargan 3 elementos de cada una al arrancar el servidor.
// Los datos están elegidos para poder probar todos los estados y filtros.

const talleres = [
  // Muchas plazas libres -> "plazas disponibles" (20 - 1 = 19)
  {
    id: 1,
    titulo: "Introducción a Docker",
    categoria: "sistemas",
    plazas: 20,
    nivel: "inicial",
  },
  // Exactamente 1 plaza libre -> "última plaza" (2 - 1 = 1)
  {
    id: 2,
    titulo: "APIs con Node y Express",
    categoria: "web",
    plazas: 2,
    nivel: "avanzado",
  },
  // Sin plazas -> "completo" (1 - 1 = 0)
  {
    id: 3,
    titulo: "Accesibilidad web desde cero",
    categoria: "web",
    plazas: 1,
    nivel: "inicial",
  },
];

// tallerId debe apuntar siempre a un taller que exista.
const inscripciones = [
  { id: 1, tallerId: 1, nombre: "Curro Ximénez", email: "currox@example.com" },
  { id: 2, tallerId: 2, nombre: "Lucía Marín", email: "lucia@example.com" },
  { id: 3, tallerId: 3, nombre: "Pablo Ruiz", email: "pablo@example.com" },
];

export { talleres, inscripciones };
