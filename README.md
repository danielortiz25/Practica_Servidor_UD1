# Sistema de inscripción a talleres y actividades

Aplicación con Node.js, Express y EJS para gestionar los talleres de unas jornadas tecnológicas. Los datos viven en memoria: al reiniciar el servidor vuelven a su estado inicial.

- **Chat de apoyo:** https://claude.ai/share/4b36b06f-90a7-4444-9e1d-e059b03af8fd

## Requisitos y arranque

Necesita **Node 20.11 o superior** (se usa `import.meta.dirname`).

```
cd talleres-express
npm install
npm run dev
```

La aplicación queda en http://localhost:3000/talleres.

## Estructura

| Fichero | Contenido |
|---|---|
| `app.js` | Servidor Express: configuración, middleware `urlencoded` y rutas |
| `data/datos.js` | Colecciones `talleres` e `inscripciones` (3 elementos cada una) |
| `utils/talleres.js` | Funciones puras, sin `req` ni `res`: `obtenerPlazasRestantes`, `estaInscrito`, `validarInscripcion` y auxiliares |
| `views/talleres.ejs` | Listado con el formulario de filtros |
| `views/taller.ejs` | Ficha de un taller |
| `views/inscripcion.ejs` | Formulario de inscripción |

Datos iniciales: el taller 1 tiene 19 plazas libres, el 2 solo una (última plaza) y el 3 está completo.

## Resumen de funcionalidades

| Funcionalidad | curl | Equivalente HTML |
|---|---|---|
| Listado sin filtros | `GET /talleres` | Enlace/navegador a `/talleres` |
| Filtros (categoría, nivel, disponibles) | `GET /talleres?...` | Formulario de `/talleres` |
| Ficha y sus 3 estados | `GET /talleres/:id` | Enlace del título en el listado |
| Formulario de inscripción | `GET /talleres/:id/inscripcion` | Enlace "Inscribirme" de la ficha |
| Alta correcta | `POST /talleres/:id/inscripcion` | Formulario de inscripción |
| Alta con errores | `POST /talleres/:id/inscripcion` | Formulario de inscripción |

> En Windows se usa `curl.exe` (en PowerShell `curl` es otro comando) y las URL con `&` van entre comillas. `-i` muestra el código de estado y las cabeceras.

## Cómo se ha hecho cada funcionalidad

### 1. Listado sin filtros

`GET /talleres` recorre el array con `map()` y añade a cada taller su `plazasRestantes`, creando objetos nuevos sin modificar los de `datos.js`. Después renderiza `talleres.ejs`.

```
curl.exe "http://localhost:3000/talleres"
```

HTML: abrir `/talleres` o pulsar "Quitar filtros".

### 2. Filtros

La ruta lee `categoria`, `nivel` y `disponibles` de `req.query`. Los textos solo se aceptan si llegan como `string` (si llega un array se ignoran) y se normalizan con `trim()` y minúsculas. `disponibles` solo se activa con el texto exacto `"true"`. Los filtros son opcionales y se aplican uno detrás de otro con `filter()`, así que se pueden combinar. La vista recibe los filtros para que el formulario conserve lo elegido. La casilla lleva `value="true"`: sin ese atributo el navegador enviaría `on`.

```
curl.exe "http://localhost:3000/talleres?categoria=web"
curl.exe "http://localhost:3000/talleres?nivel=avanzado"
curl.exe "http://localhost:3000/talleres?disponibles=true"
curl.exe "http://localhost:3000/talleres?categoria=web&disponibles=true"
curl.exe "http://localhost:3000/talleres?categoria=web&nivel=avanzado&disponibles=true"
```

HTML: formulario de filtros de `/talleres` (dos selects y una casilla).

### 3. Plazas restantes

`obtenerPlazasRestantes(taller, inscripciones)` cuenta con `filter()` las inscripciones cuyo `tallerId` coincide con el `id` del taller y resta ese número a `plazas`. Usa `Math.max(0, ...)` para que nunca salga un valor negativo.

### 4. Ficha y estados

`GET /talleres/:id` convierte el id con `parsearId` (solo acepta enteros positivos mediante una expresión regular), busca el taller con `find()` y calcula sus plazas y su estado con `obtenerEstadoTaller`, que devuelve la clave `disponible`, `ultima` o `completo`. La vista `taller.ejs` muestra un mensaje distinto en cada caso ("N plazas disponibles", "Última plaza disponible", "Completo") y solo enlaza al formulario si no está completo.

```
curl.exe "http://localhost:3000/talleres/1"
curl.exe "http://localhost:3000/talleres/2"
curl.exe "http://localhost:3000/talleres/3"
```

HTML: pulsar el título de un taller en el listado.

### 5. Formulario de inscripción

`GET /talleres/:id/inscripcion` valida el id y busca el taller con la misma función auxiliar que la ficha. Si el taller está completo no se muestra el formulario y responde 409. En caso contrario renderiza `inscripcion.ejs` con `errores` y `valores` vacíos, para que la misma vista sirva después para repintar con errores.

```
curl.exe -i "http://localhost:3000/talleres/1/inscripcion"
curl.exe -i "http://localhost:3000/talleres/3/inscripcion"
```

HTML: enlace "Inscribirme" de la ficha.

### 6. Alta de inscripciones (POST)

`express.urlencoded` deja los campos del formulario en `req.body`. La ruta comprueba, por este orden:

1. Que el id es válido y el taller existe (400 / 404).
2. Que quedan plazas (409), aunque el formulario no se mostrara, porque se puede enviar un POST directo.
3. Que `validarInscripcion` no devuelve errores (400).
4. Que el correo no está ya inscrito en ese taller, con `estaInscrito` (400, error bajo el campo `email`).

Todo lo que llega del navegador se trata como no fiable: se comprueba que sea texto, se recorta y se limita su longitud. Si hay errores se vuelve a pintar el formulario con los errores y los valores normalizados. Si todo es correcto se guarda la inscripción con un id nuevo (`siguienteId`: el máximo actual más uno) y los datos normalizados, y se aplica **PRG**: la respuesta es una redirección 303 a la ficha del taller. Así, al recargar el navegador repite un GET y no duplica la inscripción.

Caso correcto (devuelve 303 con `Location: /talleres/1`):

```
curl.exe -i --data-urlencode "nombre=Ana Perez" --data-urlencode "email=ana@example.com" "http://localhost:3000/talleres/1/inscripcion"
```

Con `-L` sigue la redirección y muestra la ficha ya actualizada (no se usa `-X POST`, porque forzaría POST también tras el 303):

```
curl.exe -L --data-urlencode "nombre=Marta Gil" --data-urlencode "email=marta@example.com" "http://localhost:3000/talleres/1/inscripcion"
```

Casos con errores:

```
# Nombre vacío y correo inválido: 400 con los dos errores
curl.exe -i --data-urlencode "nombre=" --data-urlencode "email=mal" "http://localhost:3000/talleres/1/inscripcion"

# Correo ya inscrito en ese taller: 400 (currox@example.com es del taller 1 desde el inicio)
curl.exe -i --data-urlencode "nombre=Curro" --data-urlencode "email=currox@example.com" "http://localhost:3000/talleres/1/inscripcion"

# Taller completo: 409
curl.exe -i --data-urlencode "nombre=Luis Soto" --data-urlencode "email=luis@example.com" "http://localhost:3000/talleres/3/inscripcion"

# Taller inexistente: 404
curl.exe -i "http://localhost:3000/talleres/99"

# Identificador manipulado: 400, sin romper el servidor
curl.exe -i "http://localhost:3000/talleres/abc"
curl.exe -i "http://localhost:3000/talleres/-1"
curl.exe -i "http://localhost:3000/talleres/1.5"
```

HTML: el formulario de `/talleres/:id/inscripcion` (campos `nombre` y `email`). El taller inexistente y el id manipulado se prueban escribiendo la URL en el navegador.

## Las tres funciones (`utils/talleres.js`)

Ninguna depende de `req` ni de `res`: reciben datos y devuelven datos, y `app.js` las importa.

- `obtenerPlazasRestantes(taller, inscripciones)`: `filter()` + `length`, nunca devuelve negativos.
- `estaInscrito(tallerId, email, inscripciones)`: `some()` comparando el correo sin espacios exteriores y en minúsculas.
- `validarInscripcion(datos)`: devuelve un objeto con un error por campo (`nombre`, `email`); vacío significa datos válidos. Solo valida el formato: plazas y duplicados se comprueban en la ruta.

## Códigos de estado

| Código | Cuándo |
|---|---|
| 200 | Listado, ficha y formulario correctos |
| 303 | Inscripción correcta (PRG) |
| 400 | Identificador con formato inválido, datos de formulario inválidos o correo repetido |
| 404 | Taller inexistente |
| 409 | Taller completo |

Los datos están en memoria: después de probar las altas, reinicia el servidor para volver a los datos iniciales.