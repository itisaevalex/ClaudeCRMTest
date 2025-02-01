// getRefreshToken.ts
import { google } from 'googleapis';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 5001;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5001/auth/google/callback'
);

// Generate the URL for Google's OAuth screen
const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar']
});

app.get('/', (req, res) => {
  res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('Access Token:', tokens.access_token);
    res.send('Success! You can close this window.');
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.send('Error getting tokens');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log('Please visit this URL to start the OAuth flow');
});