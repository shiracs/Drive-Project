# Drive Project - Setup and Run Instructions

## Native App Client - Preparation

### 0. Prerequisites
Install the **Expo Go** app on your physical phone or emulator.

### Option A: Running on an Emulator
1. Open the emulator **before** running the docker-compose command
2. Ensure **Expo Go** is installed on the emulator

### Option B: Running on Physical Device
1. Ensure the device is connected to the **same Wi-Fi** as your computer
2. Make sure **Windows Firewall** allows connections to Docker on port 19000

---

## 1. Building and Running Containers

From the root of the project, run:
```bash
HOST_IP=192.168.X.X docker-compose up --build
```
> *HOST_IP should be your computer's IP address!(the instructions to get it are in the previous page)*

---

## 2. Accessing the Applications

### React Web Client
Available at: http://localhost:3000

### Mobile Client (Expo Go)
1. In the `client-mobile` logs, find: `Metro Bundler ready exp://192.168.X.X:19000`
2. Open **Expo Go** → "Enter URL manually" → enter the URL from the log
3. Alternatively, scan the QR code displayed in the logs

---

## 3. Cleanup

To stop and remove all containers:

```bash
docker-compose down
```
