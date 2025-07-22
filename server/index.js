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
  let minaPisada = false;

  if (!tablero[i] || !tablero[i][j] || tablero[i][j].descubierta) return { tablero, minaPisada };

  const nuevo = tablero.map(fila => fila.map(c => ({ ...c })));

  const stack = [[i, j]];
  let jugador;

  while (stack.length > 0) {
    const [x, y] = stack.pop();

    if (!nuevo[x][y].descubierta) {
      if (bandera) {
        if (nuevo[x][y].bandera) {
          nuevo[x][y].bandera = false;
          if (nuevo[x][y].mina) {
            const jugador = jugadores.find(j => j.id === jugadorId);
            if (jugador) jugador.puntos--;
          }
        } else {
          nuevo[x][y].bandera = true;
          if (nuevo[x][y].mina) {
            jugador = jugadores.find(j => j.id === jugadorId);
            if (jugador) jugador.puntos++;
          }
        }
      } else {
        if (!nuevo[x][y].bandera) {
          nuevo[x][y].descubierta = true;
          if (nuevo[x][y].mina) {
            minaPisada = true; // 💥 Aquí lo detectamos
          } else {
            jugador = jugadores.find(j => j.id === jugadorId);
            if (jugador) jugador.puntos++;
          }

          if (nuevo[x][y].minasAlrededor === 0 && !nuevo[x][y].mina) {
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx;
                const ny = y + dy;
                if (
                  nx >= 0 &&
                  nx < filas &&
                  ny >= 0 &&
                  ny < columnas &&
                  !nuevo[nx][ny].descubierta &&
                  !nuevo[nx][ny].bandera
                ) {
                  stack.push([nx, ny]);
                }
              }
            }
          }
        }
      }
    }
  }

  return { tablero: nuevo, minaPisada };
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
    if (!jugadores.find(j => j.id === socket.id)) {
      jugadores.push(new Jugador(socket.id, 0));
    }

    console.log('jugadores', jugadores);
    console.log(`Clic recibido en (${x}, ${y}) por ${socket.id}`);
    contador++;

    // ✅ Primero descubrimos la celda
    const resultado = descubrirCelda(x, y, bandera, tableroCompartido, socket.id);
    tableroCompartido = resultado.tablero;

    // ✅ Luego emitimos el nuevo tablero y movimiento
    io.emit('estadoTablero', tableroCompartido);
    io.emit('actualizarMov', { puntos: contador });

    if (resultado.minaPisada) {
      console.log(`Jugador ${socket.id} tocó mina en (${x}, ${y})`);
      io.emit('puntajes', jugadores);
      socket.broadcast.emit('perdio', { perdedor: socket.id });
      socket.emit('perdiste');
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

server.listen(3000, () => {
  console.log('Servidor WebSocket corriendo en puerto 3000');
});
