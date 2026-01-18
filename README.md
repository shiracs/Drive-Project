# Drive Project - Setup and Run Instructions

This project includes:
- **Server** (C++)
- **Web Server** (Node.js / Express)
- **Client React** (React / Web)
- **Client Mobile** (React Native / Expo)
- **MongoDB**

---

## 1. Prerequisites

- Docker & Docker Compose installed
- Node.js **not required** (everything runs inside Docker)
- Windows / WSL2 or Mac/Linux
- Mobile device or emulator connected to the **same local network (LAN)**

---

## 2. Native App Client - Preparation

### Prerequisites
Install the **Expo Go** app on your physical phone or emulator.

### Option A: Running on an Emulator
1. Open the emulator **before** running the docker-compose command
2. Ensure **Expo Go** is installed on the emulator

### Option B: Running on Physical Device
1. Ensure the device is connected to the **same Wi-Fi** as your computer
2. Make sure **Windows Firewall** allows connections to Docker on port 19000

---

## 3. Building and Running Containers

From the root of the project, run:

```bash
docker-compose up --build
```

The containers include:
- **server** → port 8080
- **web-server** → port 5000
- **client-react** → port 3000
- **client-mobile** → ports 19000, 19001, 19002
- **mongo** → port 27017

---

## 4. Accessing the Applications

### React Web Client
Available at: http://localhost:3000

### Mobile Client (Expo Go)
1. In the `client-mobile` logs, find: `Metro Bundler ready exp://192.168.X.X:19000`
2. Open **Expo Go** → "Enter URL manually" → enter the URL from the log
3. Alternatively, scan the QR code displayed in the logs

---

## 5. Cleanup

To stop and remove all containers:

```bash
docker-compose down
```
