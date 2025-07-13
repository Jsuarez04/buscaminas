import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const filas = 8;
const columnas = 8;
const cantidadMinas = 10;

// Crea un tablero vacío con minas aleatorias
function generarTablero() {
  const tablero = Array(filas)
    .fill(null)
    .map(() =>
      Array(columnas).fill({
        mina: false,
        descubierta: false,
        minasAlrededor: 0,
      })
    );

  // Clonamos el tablero para modificarlo sin referencia
  const nuevoTablero = tablero.map(fila => fila.map(celda => ({ ...celda })));

  // Agregar minas aleatorias
  let minasColocadas = 0;
  while (minasColocadas < cantidadMinas) {
    const i = Math.floor(Math.random() * filas);
    const j = Math.floor(Math.random() * columnas);
    if (!nuevoTablero[i][j].mina) {
      nuevoTablero[i][j].mina = true;
      minasColocadas++;
    }
  }

  // Calcular minas alrededor
  for (let i = 0; i < filas; i++) {
    for (let j = 0; j < columnas; j++) {
      if (nuevoTablero[i][j].mina) continue;
      let total = 0;
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          const ni = i + x;
          const nj = j + y;
          if (
            ni >= 0 &&
            ni < filas &&
            nj >= 0 &&
            nj < columnas &&
            nuevoTablero[ni][nj].mina
          ) {
            total++;
          }
        }
      }
      nuevoTablero[i][j].minasAlrededor = total;
    }
  }

  return nuevoTablero;
}

export default function App() {
  const [tablero, setTablero] = useState([]);

  useEffect(() => {
    setTablero(generarTablero());
  }, []);

  // Descubrir celda y expandir si no hay minas alrededor
  const descubrirCelda = (i, j) => {
    if (!tablero[i] || !tablero[i][j] || tablero[i][j].descubierta) return;

    const nuevo = tablero.map(fila => fila.map(c => ({ ...c })));
    const stack = [[i, j]];

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      if (!nuevo[x][y].descubierta) {
        nuevo[x][y].descubierta = true;

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
                !nuevo[nx][ny].descubierta
              ) {
                stack.push([nx, ny]);
              }
            }
          }
        }
      }
    }

    setTablero(nuevo);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Buscaminas HJ</Text>
      <View style={styles.tablero}>
        {tablero.map((fila, i) => (
          <View key={i} style={styles.fila}>
            {fila.map((celda, j) => (
              <TouchableOpacity
                key={j}
                style={[
                  styles.celda,
                  celda.descubierta && styles.descubierta,
                  celda.mina && celda.descubierta && styles.mina,
                ]}
                onPress={() => descubrirCelda(i, j)}
              >
                <Text style={styles.texto}>
                  {celda.descubierta
                    ? celda.mina
                      ? '💣'
                      : celda.minasAlrededor || ''
                    : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333f44',
    alignItems: 'center',
    paddingTop: 50,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  tablero: {
    alignItems: 'center',
  },
  fila: {
    flexDirection: 'row',
  },
  celda: {
    width: 40,
    height: 40,
    backgroundColor: '#444',
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descubierta: {
    backgroundColor: '#bbb',
  },
  mina: {
    backgroundColor: '#ff4d4d',
  },
  texto: {
    fontWeight: 'bold',
    color: '#fff',
  },
});
