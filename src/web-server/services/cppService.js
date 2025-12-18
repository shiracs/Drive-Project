import net from 'net';

/**
 * Sends a command to the C++ server and returns the response.
 * @param {string} command
 * @returns {Promise<string>}
 */
const sendToCpp = (command) => {
    return new Promise((resolve, reject) => {
        const client = net.createConnection({ port: 8080, host: 'server' });
        
        let responseData = '';
        let commandSent = false;

        client.on('connect', () => {
            // שולחים את הפקודה האמיתית
            client.write(command + '\n');
            commandSent = true;
        });

        client.on('data', (data) => {
            responseData += data.toString();
            
            // בשרת ה-C++, התגובה מסתיימת ב-\n
            // ברגע שקיבלנו תגובה שלמה לפקודה שלנו, אנחנו שולחים 'exit'
            if (responseData.includes('\n')) {
                client.write('exit\n'); 
                // אנחנו לא סוגרים ידנית, אלא מחכים שהשרת יסגור את הצד שלו
            }
        });

        client.on('end', () => {
            // כאן ה-C++ סגר את הסוקט מרצונו אחרי ה-exit
            resolve(responseData.trim());
        });

        client.on('error', (err) => {
            reject(new Error(`TCP Error: ${err.message}`));
        });

        client.setTimeout(4000);
        client.on('timeout', () => {
            client.destroy();
            reject(new Error('C++ Server Timeout'));
        });
    });
};

export default { sendToCpp };