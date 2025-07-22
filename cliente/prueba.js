import React, { useEffect, useRef, useState } from 'react';
import { View, Button, Text, Alert, Modal, TouchableOpacity } from 'react-native';
import { io } from 'socket.io-client';

export default function App() {
  const socketRef = useRef(null);
  const [contador, setContador] = useState(0);
  const contadorRef = useRef(contador);


  useEffect(() => {
    contadorRef.current = contador;
  }, [contador]);

  useEffect(() => {
    const socket = io('http://192.168.0.108:3000'); // cambia por tu IP
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado con ID:', socket.id);
    });

    socket.on('actualizarMov', ({ puntos }) => {
      setContador(puntos);
    });

    socket.on('actualizarCelda', ({ socketId, x, y, valor }) => {
      Alert.alert(`${socketId} Actualizó ${x},${y} con ${valor}, c: ${contadorRef.current+1}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const manejarClick = ({ x, y }) => {
    socketRef.current?.emit('clickCelda', { x,y });
  };

  return (
    <View style={{ marginTop: 50, padding: 20 }}>
      <Button title={contador.toString()} onPress={() => manejarClick({ x: 2, y: 3 })}/>
      <Text>Buscaminas multijugador</Text>


    <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(true)}
      >
        <View style={{ width: '80%', height: '50%', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Modal visible</Text>
            <View style={styles.botones}>
                <Text>{jugadores}</Text>
                <TouchableOpacity title='Guardar' onPress={() => setModalVisible(false)}></TouchableOpacity>
                <TouchableOpacity title="Cancelar" onPress={() => setModalVisible(false)} ></TouchableOpacity>
            </View>
        </View>
      </Modal>


    </View>
  );
}
