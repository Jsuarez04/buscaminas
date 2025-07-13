# 🎮 Buscaminas Multijugador por Turnos

Este proyecto es una versión del clásico **Buscaminas**, adaptado para jugarse **por turnos entre dos jugadores**, similar al estilo de **Tic Tac Toe**. Fue desarrollado como parte de una asignación para la materia **Sistemas Operativos**, integrando conceptos como **buffers de comunicación**, **sincronización de turnos** y **sockets** para intercambio de datos en tiempo real.

## 🚀 Tecnologías utilizadas

### 📱 Frontend
- **React Native** con **Expo**
- Manejo de estados con `useState` y `useEffect`
- Conexión vía **Socket.IO Client**

### 🌐 Backend
- **Node.js** con **Express**
- **Socket.IO** para comunicación en tiempo real entre jugadores
- Estructura de juego mantenida en memoria (sin persistencia en base de datos)

## 🧠 Lógica del Juego

- El tablero contiene minas distribuidas aleatoriamente.
- Cada jugador revela una celda en su turno.
- Si un jugador toca una mina, pierde.
- Si se descubren todas las celdas sin minas, el jugador que hizo la última jugada gana.
- El estado del tablero se sincroniza entre ambos jugadores a través del servidor.

## 🧩 Estructura del proyecto

buscaminas-turnos/
├── backend/ # Servidor Node.js con Socket.IO
│ └── index.js
├── frontend/ # App React Native con Expo
│ └── App.js
├── README.md
└── package.json


## ⚙️ Instalación y ejecución

### Requisitos

- Node.js ≥ 14.x
- Expo CLI
- Dispositivos físicos o emuladores para probar la app

### Backend

cd backend
npm install
node index.js
Frontend

cd frontend
npm install
npx expo start
Asegúrate de que el frontend y backend estén en la misma red local o usa ngrok si quieres conectarte desde fuera.

🔄 Flujo de Turnos
Jugador A se conecta.

Jugador B se conecta.

El servidor indica a quién le toca.

Al hacer clic en una celda, se envía la jugada al servidor.

El servidor actualiza el estado y lo transmite al otro jugador.

📚 Aprendizajes y conceptos aplicados
Comunicación entre procesos (Sockets)

Sincronización de estados en juegos multijugador

Diseño de sistemas cliente-servidor

Simulación de buffers y estructuras de datos compartidas

Aplicación móvil multiplataforma con React Native

🧑‍💻 Autor
Julio Rubinsky Suárez
Estudiante de Ingeniería Informática
Universidad Nacional Experimental de Guayana
