import http from 'http';
import { Server } from 'socket.io';

let filas;
let columnas;
let cantidadMinas;
let jugadores = [];
let contador = 0;
class Jugador {
  constructor(id, puntos) {
    this.id = id;
    this.puntos = puntos;
  }
}

// Generar tablero en el servidor
function generarTablero() {
  contador = 0;
  jugadores = [];
  const tablero = Array(filas)
    .fill(null)
    .map(() =>
      Array(columnas).fill({
        mina: false,
        descubierta: false,
        minasAlrededor: 0,
        bandera: false,
      })
    );

  const nuevoTablero = tablero.map(fila => fila.map(c => ({ ...c })));

  let minasColocadas = 0;
  while (minasColocadas < cantidadMinas) {
    const i = Math.floor(Math.random() * filas);
    const j = Math.floor(Math.random() * columnas);
    if (!nuevoTablero[i][j].mina) {
      nuevoTablero[i][j].mina = true;
      minasColocadas++;
    }
  }

  for (let i = 0; i < filas; i++) {
    for (let j = 0; j < columnas; j++) {
      if (nuevoTablero[i][j].mina) continue;
      let total = 0;
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          const ni = i + x;
          const nj = j + y;
          if (ni >= 0 && ni < filas && nj >= 0 && nj < columnas && nuevoTablero[ni][nj].mina) {
            total++;
          }
        }
      }
      nuevoTablero[i][j].minasAlrededor = total;
    }
  }
  console.log('nuevoTablero', nuevoTablero);
  return nuevoTablero;
}

function descubrirCelda(i, j, bandera, tablero, jugadorId) {
  // Verifica que la celda exista y no haya sido descubierta ya
  if (!tablero[i] || !tablero[i][j] || tablero[i][j].descubierta) return tablero;

  // Crea una copia profunda del tablero para no modificar el original directamente
  const nuevo = tablero.map(fila => fila.map(c => ({ ...c })));

  // Stack para gestionar las celdas que se deben procesar (expansión)
  const stack = [[i, j]];
  let jugador;
  // Mientras haya celdas por procesar
  while (stack.length > 0) {
    const [x, y] = stack.pop();

    // Si la celda aún no está descubierta
    if (!nuevo[x][y].descubierta) {
      if (bandera) {
        if (nuevo[x][y].bandera) {
          nuevo[x][y].bandera = false;
          if (nuevo[x][y].mina) {
            const jugador = jugadores.find(j => j.id === jugadorId);
            if (jugador) {
              jugador.puntos--;
              console.log('jugadores:', jugadores);
            }
          }
        } else {
          nuevo[x][y].bandera = true;
          if (nuevo[x][y].mina) {
            jugador = jugadores.find(j => j.id === jugadorId);
            if (jugador) {
              jugador.puntos++;
              console.log('jugadores:', jugadores);
            }
          } // Marcamos si es una bandera (click derecho, por ejemplo)
        }
      } else {
        if (!nuevo[x][y].bandera) {
          nuevo[x][y].descubierta = true; // La marcamos como descubierta
          if (nuevo[x][y].mina) {
          } else {
            jugador = jugadores.find(j => j.id === jugadorId);
            if (jugador) {
              jugador.puntos++;
              console.log('jugadores:', jugadores);
            }
          }
          // Si no es mina y no hay minas alrededor, y no estamos poniendo una bandera
          if (nuevo[x][y].minasAlrededor === 0 && !nuevo[x][y].mina) {
            // Expandimos a sus celdas vecinas
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx;
                const ny = y + dy;

                // Verificamos que la nueva posición esté dentro de los límites del tablero
                // y que aún no haya sido descubierta
                if (
                  nx >= 0 &&
                  nx < filas &&
                  ny >= 0 &&
                  ny < columnas &&
                  !nuevo[nx][ny].descubierta &&
                  !nuevo[nx][ny].bandera
                ) {
                  stack.push([nx, ny]); // La añadimos al stack para procesar su expansión
                }
              }
            }
          }
        }
      }
    }
  }

  // Retornamos el nuevo tablero actualizado
  return nuevo;
}
function comprobarMina(x, y, bandera, tablero) {
  return (
    tablero[x][y].mina && bandera === false && !tablero[x][y].descubierta && !tablero[x][y].bandera
  );
}

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

let tableroCompartido; // Tablero común

io.on('connection', socket => {
  console.log('Jugador conectado:', socket.id);

  socket.on('tamanoTablero', ({ x, y }) => {
    columnas = x;
    filas = y;
    cantidadMinas = filas + 2;
    tableroCompartido = generarTablero();
    console.log(`columnas: ${columnas}, filas:${filas}, minas:${cantidadMinas}`);
    socket.emit('estadoTablero', tableroCompartido);
  });

  // Enviar tablero actual al jugador que se conecta

  socket.emit('actualizarMov', { puntos: contador });

  socket.on('clickCelda', ({ x, y, bandera }) => {
    if (jugadores.find(j => j.id === socket.id)) {
    } else {
      jugadores.push(new Jugador(socket.id, 0));
    }
    console.log('jugadores', jugadores);
    console.log(`Clic recibido en (${x}, ${y}) por ${socket.id}`);
    contador++;

    tableroCompartido = descubrirCelda(x, y, bandera, tableroCompartido, socket.id);

    io.emit('estadoTablero', tableroCompartido);

    io.emit('actualizarMov', { puntos: contador });

    if (comprobarMina(x, y, bandera, tableroCompartido)) {
      io.emit('puntajes', jugadores);
      io.emit('estadoTablero', tableroCompartido);
      io.emit('actualizarMov', { puntos: contador });
      socket.broadcast.emit('perdio', { perdedor: socket.id });
      socket.emit('perdiste');
    } else {
      verificarFinDeJuego(tableroCompartido, jugadores);
    }
  });

  socket.on('disconnect', () => {
    console.log('Jugador desconectado:', socket.id);
    let jugadorIn = jugadores.findIndex(j => j.id === socket.id);
    if (jugadorIn !== -1) {
      jugadores.splice(jugadorIn, 1);
      console.log('jugadores', jugadores);
    }
  });
});

function verificarFinDeJuego(tablero, jugadores) {
  let casillasSeguras = 0;
  let casillasDescubiertas = 0;

  for (let fila of tablero) {
    for (let casilla of fila) {
      if (!casilla.mina) casillasSeguras++;
      if (!casilla.mina && casilla.descubierta) casillasDescubiertas++;
    }
  }

  if (casillasSeguras === casillasDescubiertas) {
    const ordenados = [...jugadores].sort((a, b) => b.puntos - a.puntos);
    const maxPuntos = ordenados[0]?.puntos || 0;
    const ganadores = ordenados.filter(j => j.puntos === maxPuntos);

    const resultado = {
      ganador: ganadores.length === 1 ? ganadores[0].id : null,
      empate: ganadores.length > 1,
      puntos: ordenados.map(j => ({ id: j.id, puntos: j.puntos })),
      ganadores: ganadores.map(g => g.id),
    };

    io.emit('juegoTerminado', resultado);
  }
}

server.listen(3000, () => {
  console.log('Servidor WebSocket corriendo en puerto 3000');
});
