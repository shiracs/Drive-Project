# Setup & Configuration

## 1. Download the Code
Open your terminal and run the following command to download the project:

```bash
git clone [https://github.com/YOUR_USER/YOUR_REPO.git](https://github.com/shiracs/Drive-Project.git)
cd Drive-Project
```

## 2. Set Your IP Address (Important!)
Since the mobile app runs on your physical phone, it cannot simply connect to "localhost". It needs to know your computer's real IP address on the network.

### Step 1: Find your IP Address
* **Windows:** Open a terminal (Command Prompt) and type `ipconfig`. Look for the line that says "IPv4 Address".
* **Mac/Linux:** Open a terminal and type `ifconfig`.

### Step 2: Update the settings
1.  Go to the main project folder (where `docker-compose.yml` is located).
2.  Create a new file named `.env`.
3.  Add the following line inside the file (replace the `XX` with your actual IP):

```text
MY_IP_ADDRESS=192.168.1.XX
```

> **⚠️ Important:** If you skip this step, the mobile app will give you a "Network Error" and will not work.