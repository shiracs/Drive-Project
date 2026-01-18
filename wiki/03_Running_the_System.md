# How to Run the System

We use **Docker Compose** to build and run the entire project automatically. You don't need to run separate commands for each server.

## Start Command
Open a terminal in the main project folder and run:

```bash
docker compose up --build
```

**This command will automatically:**
1.  Compile the C++ server code.
2.  Install all the necessary libraries for the Web and Mobile apps.
3.  Start the database (MongoDB), the servers, and the clients.

## How to know it's working?
It might take a few minutes the first time. Wait for the logs to stop scrolling fast. Look for these signs to know everything is ready:

1.  **MongoDB:** You will see a log saying `Waiting for connections`.
2.  **Web Server:** You will see `Connected to MongoDB`.
3.  **Mobile Client:** You will see a large **QR Code** generated in the terminal.

## Connect Your Phone
1.  Download and open the **Expo Go** app on your phone.
2.  Scan the QR Code displayed in your terminal.
3.  Wait a moment for the Javascript bundle to load (it might take a minute).