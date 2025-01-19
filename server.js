const express = require('express');
const cors = require('cors'); // Enable CORS
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 2Factor API Key
const TWO_FACTOR_API_KEY = '7dbd87a6-3920-11ee-addf-0200cd936042'; // Replace with your actual 2Factor API Key

// In-memory OTP storage (for simplicity)
let otpStorage = {};

// Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.json({ success: false, message: 'Mobile number is required' });
  }

  try {
    // 2Factor API URL for sending OTP
    const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${mobile}/AUTOGEN`;

    // Call 2Factor API
    const response = await fetch(url);
    const data = await response.json();

    if (data.Status === 'Success') {
      // Store session ID from 2Factor API
      otpStorage[mobile] = data.Details;
      return res.json({ success: true, message: 'OTP sent successfully' });
    } else {
      return res.json({ success: false, message: data.Details || 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.json({ success: false, message: 'An error occurred while sending OTP.' });
  }
});

// Endpoint to verify OTP
app.post('/verify-otp', async (req, res) => {
  const { mobile, otp } = req.body;

  if (!otpStorage[mobile]) {
    return res.json({ success: false, message: 'OTP session not found or expired' });
  }

  try {
    // 2Factor API URL for verifying OTP
    const sessionId = otpStorage[mobile];
    const url = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;

    // Call 2Factor API to verify OTP
    const response = await fetch(url);
    const data = await response.json();

    if (data.Status === 'Success') {
      delete otpStorage[mobile]; // Clear OTP session after successful verification
      return res.json({ success: true, message: 'Mobile number verified successfully' });
    } else {
      return res.json({ success: false, message: 'Invalid OTP. Please try again.' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.json({ success: false, message: 'An error occurred while verifying OTP.' });
  }
});

// Export the app for Vercel
module.exports = app;
