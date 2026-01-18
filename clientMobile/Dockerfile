FROM node:20-bullseye

WORKDIR /opt/react_native_app

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

EXPOSE 19000 19001 19002

# Start Expo in LAN mode ONLY
CMD ["npx", "expo", "start", "--lan"]
