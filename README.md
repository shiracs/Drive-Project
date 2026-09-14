# ☁️ Drive — Distributed File Storage System

> **Advanced System Programming Course** | Bar-Ilan University  
> **Final Grade:** 100 / 100

A distributed file storage system enabling users to upload, manage, and access files seamlessly across both web and mobile clients. The architecture couples a high-performance C++ core backend with a Node.js/Express API layer, modern frontends (React & React Native/Expo), and MongoDB for persistent storage, fully orchestrated via Docker Compose.

---

## 🧩 System Components

| Component | Technology | Role |
| :--- | :--- | :--- |
| 🖥️ **Core Server** | C++ | Low-level backend processing and file handling |
| 🌐 **API Gateway** | Node.js · Express | Web API layer and inter-service communication |
| 💻 **Web Client** | React | Browser-based user interface |
| 📱 **Mobile Client** | React Native · Expo | Cross-platform mobile application |
| 🗄️ **Database** | MongoDB | Metadata and persistent application state |
| 🐳 **Orchestration** | Docker · Docker Compose | Multi-container networking and service lifecycle |

---

## 🛠️ Tech Stack

* **Languages & Core:** C++, JavaScript, TypeScript
* **Backend:** Node.js, Express.js
* **Frontend:** React, React Native, Expo
* **Database:** MongoDB
* **DevOps & Infrastructure:** Docker, Docker Compose, Linux / WSL2

---

## ⭐ Key Highlights

* **Distributed Architecture:** Designed an end-to-end multi-tier system with clear separation of concerns.
* **Low-Level Systems Programming:** Built core server functionality and efficient client-server protocols using C++.
* **Cross-Platform Access:** Unified user access across both web (React) and mobile (React Native/Expo).
* **Containerized Deployment:** Entire ecosystem launches via Docker Compose with zero local toolchain dependencies.
* **Inter-Service Networking:** Established clean network communication channels between decoupled microservices.

---

## 🚀 Setup & Run Instructions

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
HOST_IP=192.168.X.X docker-compose up --build
```
> *HOST_IP should be your computer's IP address !*

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
