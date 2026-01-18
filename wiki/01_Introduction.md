# 📘 Introduction

This project is a **File Storage System** (like a simplified Google Drive).
It allows users to upload, download, and manage files from a Website and a Mobile App.

The system uses **Docker** to run everything. You can build and start the whole project with just one command.

## System Architecture
The project has 5 parts working together:
* **Database:** MongoDB (Saves user info and file details).
* **Core Server:** C++ (Manages the actual files on the disk).
* **Web Server:** Node.js (Connects the clients to the C++ server).
* **Web Client:** A React website.
* **Mobile Client:** A React Native app (using Expo).

## Prerequisites
Before you start, make sure you have these installed:
1.  **Docker Desktop** (Keep it open in the background).
2.  **Git**.
3.  **Expo Go App** (On your phone).