import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

//const filas = 8;
//const columnas = 8;

export default function App() {
  const [tablero, setTablero] = useState([]); // Representación del tablero
  const [contador, setContador] = useState(0); // Contador de movimientos
  const socketRef = useRef(null); // Referencia persistente al socket
  const [frasePerdedor, setFrasePerdedor] = useState(''); // Mensaje cuando alguien pierde
  const [columnas, setColumnas] = useState(''); // Columnas personalizadas
  const [filas, setFilas] = useState(''); // Filas personalizadas
  const contadorRef = useRef(contador); // Ref al contador para evitar problemas de asincronía
  const [bandera, setBandera] = useState(false); // Modo bandera ON/OFF
  const [jugador, setJugador] = useState(''); // ID del jugador
  const [jugadores, setJugadores] = useState([]); // Lista de jugadores con puntajes
  const [modalVisible, setModalVisible] = useState(false); // Modal de puntajes
  const [nivelVisible, setNivelVisible] = useState(true); // Modal de selección de dificultad
  const [tabPersonalizado, setTabPersonalizado] = useState(false); // Modal para tablero personalizado
  const [estadoBandera, setEstadoBandera] = useState('OFF'); // Indicador de estado bandera

  useEffect(() => {
    contadorRef.current = contador;
  }, [contador]);

  const cambiarModo = () => {
    setBandera(!bandera);
    setEstadoBandera(estadoBandera === 'OFF' ? 'ON' : 'OFF');
  };

  const verificarGanador = () => {
    if (jugador1.perdio || jugador2.perdio) return;

    if (jugador1.puntos > jugador2.puntos) {
      setGanador(jugador1.nombre);
    } else if (jugador2.puntos > jugador1.puntos) {
      setGanador(jugador2.nombre);
    } else {
      setGanador('Empate');
    }

    socket.emit('finJuego', {
      ganador,
      puntosJugador1: jugador1.puntos,
      puntosJugador2: jugador2.puntos,
    });
  };
  useEffect(() => {
    const socket = io('http://192.168.1.10:3000'); // IP del backend (puede cambiar en otras redes)
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado con ID:', socket.id);
      setJugador(socket.id); // Guardar ID del jugador
    });

    socket.on('estadoTablero', tableroRecibido => {
      setTablero(tableroRecibido); // Recibir estado del tablero
    });

    socket.on('actualizarMov', ({ puntos }) => {
      setContador(puntos); // Actualizar cantidad de movimientos
    });

    socket.on('perdiste', () => {
      setFrasePerdedor('Explotaste una mina 💣, perdiste!');
    });

    socket.on('perdio', ({ perdedor }) => {
      setFrasePerdedor(`El perdedor es: ${perdedor}`);
    });

    socket.on('puntajes', jugadores => {
      setJugadores(jugadores); // Mostrar puntajes
      setModalVisible(true);
    });

    return () => {
      socket.disconnect(); // Desconectar cuando se desmonta el componente
    };
  }, []);

  const manejarClick = ({ x, y }) => {
    socketRef.current?.emit('clickCelda', { x, y, bandera });
  };

  const elegirNivel = ({ x, y }) => {
    socketRef.current?.emit('tamanoTablero', { x, y });
    setTabPersonalizado(false);
    setNivelVisible(false);
    setFilas('');
    setColumnas('');
  };

  const personalizado = () => {
    setNivelVisible(false);
    setTabPersonalizado(true);
  };

  const volverMenu = () => {
    setModalVisible(false);
    setFrasePerdedor('');
    setNivelVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Image
          source={require('./assets/logo-wobg.png')}
          style={{ width: 200, height: 122, padding: 0, elevation: 10 }}
        />
      </View>
      {/* <Text style={styles.titulo}>Puntos: {contador}</Text> */}
      <Text style={styles.titulo}>Bienvenido ID: {jugador}</Text>
      <TouchableOpacity style={styles.cambiarModo} onPress={cambiarModo}>
        <Text>Bandera 🚩:{estadoBandera}</Text>
      </TouchableOpacity>
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
                  celda.bandera && styles.bandera,
                ]}
                onPress={() => manejarClick({ x: i, y: j })}
              >
                <Text style={styles.texto}>
                  {celda.bandera
                    ? '🚩'
                    : celda.descubierta
                      ? celda.mina
                        ? '💣'
                        : celda.minasAlrededor || ''
                      : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Modal para elegir nivel */}
        <Modal
          visible={nivelVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setNivelVisible(true)}
        >
          <View style={styles.overlay}>
            <View style={styles.modalView}>
              <Text>Selecciona un nivel</Text>
              <View style={styles.containerBotones}>
                <TouchableOpacity
                  style={styles.botones}
                  onPress={() => elegirNivel({ x: 4, y: 4 })}
                >
                  <Text style={styles.textoBotones}>Fácil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botones}
                  onPress={() => elegirNivel({ x: 8, y: 8 })}
                >
                  <Text style={styles.textoBotones}>Dificil</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.botones} onPress={() => personalizado()}>
                  <Text style={styles.textoBotones}>Personalizado</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal mostrar puntuacion final del juego*/}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.modalView}>
              <Text>{frasePerdedor}</Text>
              <Text style={styles.titulo}>Puntajes:</Text>
              {jugadores.map((jugador, index) => (
                <Text key={index}>
                  {' '}
                  {jugador.id}: {jugador.puntos}
                </Text>
              ))}
              <View style={styles.containerBotones}>
                <TouchableOpacity style={styles.botones} onPress={volverMenu}>
                  <Text style={styles.textoBotones}>Volver al menú</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal para configurar nivel personalizado */}
        <Modal
          visible={tabPersonalizado}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setTabPersonalizado(true)}
        >
          <View style={styles.overlay}>
            <View style={styles.modalView}>
              <Text>Personaliza tu tablero</Text>
              <View style={styles.containerBotones}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Columnas"
                  value={columnas}
                  onChangeText={setColumnas}
                />

                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Filas"
                  value={filas}
                  onChangeText={setFilas}
                />

                <TouchableOpacity
                  style={styles.botones}
                  onPress={() => elegirNivel({ x: parseFloat(columnas), y: parseFloat(filas) })}
                >
                  <Text style={styles.textoBotones}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    alignItems: 'center',
    paddingTop: 50,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  tablero: {
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 8,
    borderRadius: 5,
    backgroundColor: '#D9D9D9',
  },
  fila: {
    flexDirection: 'row',
  },
  celda: {
    width: 40,
    height: 40,
    backgroundColor: '#FA8072',
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
  },
  descubierta: {
    backgroundColor: '#fff8f8ff',
  },
  mina: {
    backgroundColor: '#ff4d4d',
  },
  texto: {
    fontWeight: 'bold',
    color: '#ff4d4d',
    fontSize: 24,
  },
  bandera: {
    backgroundColor: 'pink',
  },
  cambiarModo: {
    padding: 10,
    margin: 10,
    borderRadius: 10,
    backgroundColor: '#bbb',
    borderWidth: 1,
  },
  containerBotones: {
    marginTop: 0,
    marginBottom: 5,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botones: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#21239A',
    width: 206,
    height: 40,
    marginTop: 30,
  },
  textoBotones: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    elevation: 5,
  },
});
