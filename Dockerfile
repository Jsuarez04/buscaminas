# Usamos una imagen base de Node.js (con Watchman instalado)
FROM node:18

# Instalamos expo-cli globalmente
RUN npm install -g expo-cli

# Definimos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias
COPY ./cliente/package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos todo el código del proyecto al contenedor
COPY ./cliente .

# Abrimos los puertos que Expo usa (puede variar según versión)
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Comando para iniciar Expo en modo túnel (funciona con Expo Go en celular)
CMD ["npx", "expo", "start", "--tunnel"]
