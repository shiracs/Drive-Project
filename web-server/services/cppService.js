import net from "net";

/**
 * Sends a command to the C++ server and returns the response.
 * @param {string} command
 * @returns {Promise<string>}
 */
export const sendToCpp = (command) => {
  return new Promise((resolve, reject) => {
    const CPP_SERVER_HOST = process.env.CPP_SERVER_HOST || "localhost";
    const CPP_SERVER_PORT = process.env.CPP_SERVER_PORT || 8080;

    const client = net.createConnection({
      port: CPP_SERVER_PORT,
      host: CPP_SERVER_HOST,
    });

    let responseData = "";
    let commandSent = false;

    client.on("connect", () => {
      client.write(command + "\n");
      commandSent = true;
    });

    client.on("data", (data) => {
      responseData += data.toString();
    });

    client.on("end", () => {
      resolve(responseData.trim());
    });

    client.on("error", (err) => {
      reject(new Error(`TCP Error: ${err.message}`));
    });

    client.setTimeout(10000);
    client.on("timeout", () => {
      client.destroy();
      reject(new Error("C++ Server Timeout"));
    });
  });
};
