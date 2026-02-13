
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// You need a valid token here. Since I can't easily get one without login, 
// I'll assume I can use the login endpoint if I had credentials, 
// OR I can rely on the user to test from the UI.
// But wait, I can use the `authenticateToken` middleware? No, I need a token.
// Let's try to login as a student first. Use a known test account or create one?
// I'll try to use a hardcoded token if I can find one in the logs? No.

// Better approach: explicit instructions to user or just rely on the UI now that I added the route?
// Actually, I can use the existing `test-gemini.js` pattern if it has auth?
// Let's just create a simple script that tries to login a dummy user (or register one) and then test.

async function test() {
    try {
        // 1. Login (assuming a test user exists, otherwise register)
        let token;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'student@example.com', // Replace with a valid test user if known
                password: 'password123'
            });
            token = loginRes.data.token;
            console.log('Logged in successfully');
        } catch (e) {
            console.log('Login failed, trying register...');
            try {
                const regRes = await axios.post(`${API_URL}/auth/register`, {
                    name: 'Test Student',
                    email: 'test_notif_student_' + Date.now() + '@example.com',
                    password: 'password123',
                    role: 'STUDENT'
                });
                // Login again
                const loginRes = await axios.post(`${API_URL}/auth/login`, {
                    email: regRes.data.user.email,
                    password: 'password123'
                });
                token = loginRes.data.token;
                console.log('Registered and logged in');
            } catch (err) {
                console.error('Auth failed completely', err.response?.data || err.message);
                return;
            }
        }

        // 2. Create Test Notification
        console.log('Creating test notification...');
        await axios.post(`${API_URL}/test/notification`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Test notification created.');

        // 3. Fetch Notifications
        console.log('Fetching notifications...');
        const res = await axios.get(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Notifications fetched:', res.data);

        if (res.data.length > 0 && res.data[0].title === 'Test Notification') {
            console.log('SUCCESS: Notifications are working!');
        } else {
            console.log('FAILURE: Notification not found.');
        }

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

test();
