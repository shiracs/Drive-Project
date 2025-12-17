const net = require('net');

/**
 * Sends a command to the C++ server and returns the response.
 * @param {string} command
 * @returns {Promise<string>}
 */
const sendToCpp = (command) => {
    return new Promise((resolve, reject) => {
        // 'server' is the service name as defined in docker-compose
        const client = net.createConnection({ port: 8080, host: 'server' }, () => {
            // sending the command to the C++ server
            client.write(command + '\n');
        });

        client.on('data', (data) => {
            resolve(data.toString());
            client.end(); 
        });

        client.on('error', (err) => {
            console.error('Connection to CPP server failed:', err.message);
            reject(err);
        });
    });
};

module.exports = { sendToCpp };