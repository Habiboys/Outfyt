// controllers/auth.controller.js
const { google } = require('googleapis');
const { User } = require('../models/index.js');
require("dotenv").config({ path: "../../.env" });
// require("dotenv").config();


const auth = async (req, res) => {
  const { idToken, authCode } = req.body;

  try {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    // Get tokens from authCode
    const { tokens } = await client.getToken(authCode);

    // Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload['sub'];

    try {
      let user = await User.findByPk(googleId);

      if (user) {
        const updateData = {
          displayName: payload['name'],
          email: payload['email'],
          photoUrl: payload['picture'],
        };

        if (tokens.refresh_token) {
          updateData.refreshTokenOauth = tokens.refresh_token;
        }

        await user.update(updateData);
      } else {
        user = await User.create({
          googleId: googleId,
          displayName: payload['name'],
          email: payload['email'],
          photoUrl: payload['picture'],
          refreshTokenOauth: tokens.refresh_token,
        });
      }

      // Only send access token to client
      res.json({
        success: true,
        user: {
          googleId: user.googleId,
          displayName: user.displayName,
          email: user.email,
          photoUrl: user.photoUrl
        },
        accessToken: tokens.access_token
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({
        success: false,
        error: 'Failed to save user data'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};





const verifyAccessToken = async (req, res, next) => {
  const accessToken = req.headers['authorization']?.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      error: 'Access token tidak ditemukan',
    });
  }

  try {
    // Inisialisasi OAuth2 Client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    // Verifikasi Access Token
    const tokenInfo = await oauth2Client.getTokenInfo(accessToken);

    // Ambil data user berdasarkan googleId
    const user = await User.findOne({ where: { googleId: tokenInfo.sub } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User tidak ditemukan',
      });
    }

    // Set Access Token dan Refresh Token ke OAuth2 Client
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: user.refreshTokenOauth, // Refresh token dari database
    });

    // Tambahkan user dan oauth2Client ke request
    req.user = user;
    req.oauth2Client = oauth2Client;

    // Lanjut ke middleware berikutnya
    next();
  } catch (error) {
    console.error('Error verifying access token:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};


const refreshAccessToken = async (req, res) => {
  const { googleId } = req.body; // Kirim googleId dari frontend untuk identifikasi user

  if (!googleId) {
    return res.status(400).json({
      success: false,
      error: 'Google ID diperlukan',
    });
  }

  try {
    const user = await User.findOne({ where: { googleId } });

    if (!user || !user.refreshTokenOauth) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token tidak valid atau user tidak ditemukan',
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: user.refreshTokenOauth });

    const { credentials } = await oauth2Client.refreshAccessToken();
    const { access_token, expiry_date } = credentials;

    // Update access token di database
    user.accessToken = access_token;
    user.tokenExpiryDate = expiry_date;
    await user.save();

    return res.status(200).json({
      success: true,
      accessToken: access_token,
      expiryDate: expiry_date,
    });
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh access token',
    });
  }
};

module.exports = { 
  auth,
  verifyAccessToken,
  refreshAccessToken
};
