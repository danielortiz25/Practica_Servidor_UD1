// Lógica pura de talleres: recibe datos y devuelve datos, sin tocar req ni res.

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Solo se acepta texto. Si llega otra cosa (undefined, array, objeto...) se trata como vacío.
function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// Dos correos son el mismo aunque cambien mayúsculas o espacios exteriores.
function normalizarEmail(valor) {
  return normalizarTexto(valor).toLocaleLowerCase('es');
}

function normalizarInscripcion(datos) {
  const origen = datos ?? {};
  return {
    nombre: normalizarTexto(origen.nombre),
    email: normalizarEmail(origen.email)
  };
}

function obtenerPlazasRestantes(taller, inscripciones) {
  const ocupadas = inscripciones.filter((i) => i.tallerId === taller.id).length;
  // Nunca negativo: con más inscripciones que plazas, quedan 0.
  return Math.max(0, taller.plazas - ocupadas);
}

// Devuelve una clave corta: "disponible", "ultima" o "completo".
// El texto que se muestra al usuario ("15 plazas disponibles"...) lo decide la vista.
function obtenerEstadoTaller(plazasRestantes) {
  // Si el dato no es un entero válido, se trata como completo para no ofrecer plazas que no existen.
  if (!Number.isInteger(plazasRestantes) || plazasRestantes <= 0) {
    return "completo";
  }
  if (plazasRestantes === 1) {
    return "ultima";
  }
  return "disponible";
}

function estaInscrito(tallerId, email, inscripciones) {
  const buscado = normalizarEmail(email);
  return inscripciones.some(
    (i) => i.tallerId === tallerId && normalizarEmail(i.email) === buscado
  );
}

// Devuelve un objeto de errores con el nombre del campo como clave.
// Objeto vacío = datos válidos. Solo valida el formato: plazas y duplicados se comprueban en la ruta.
function validarInscripcion(datos) {
  const { nombre, email } = normalizarInscripcion(datos);
  const errores = {};

  if (nombre.length < 2) {
    errores.nombre = 'Escribe al menos dos caracteres';
  } else if (nombre.length > 60) {
    errores.nombre = 'Máximo 60 caracteres';
  }

  if (email === '') {
    errores.email = 'El correo es obligatorio';
  } else if (email.length > 100 || !EMAIL_VALIDO.test(email)) {
    errores.email = 'Escribe un correo válido';
  }

  return errores;
}

// Convierte el :id de la URL en un entero positivo. Devuelve null si no es válido.
function parsearId(valor) {
  if (typeof valor !== "string" || !/^[1-9]\d*$/.test(valor)) {
    return null;
  }
  const id = Number(valor);
  return Number.isSafeInteger(id) ? id : null;
}

// Siguiente id libre: el máximo actual más uno.
// length + 1 podría repetir un id si algún día se borran inscripciones.
function siguienteId(coleccion) {
  return coleccion.length === 0
    ? 1
    : Math.max(...coleccion.map((elemento) => elemento.id)) + 1;
}

export {
  normalizarInscripcion,
  obtenerPlazasRestantes,
  obtenerEstadoTaller,
  estaInscrito,
  validarInscripcion,
  parsearId,
  siguienteId
};