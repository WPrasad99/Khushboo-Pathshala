const http = require('http');

async function checkServer() {
    console.log('--- Checking Server Status ---');
    // Using http because we want raw connection check
    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/admin/users',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer INVALID_TOKEN_TEST'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Server responded with STATUS: ${res.statusCode}`);
        // If 403 or 401, server is running.
    });

    req.on('error', (e) => {
        console.log(`Problem with request: ${e.message}`);
    });

    req.end();
}
checkServer();
