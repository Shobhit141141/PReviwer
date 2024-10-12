import User from '../models/user.js';

export const getTokenByUsername = async (username) => {
  try {
    const user = await User.findOne({ username });
    if (user) {
      const accessToken = user.decryptAccessToken(); 
      return accessToken;
    }

    return null;
  } catch (error) {
    console.error('Error fetching token by username:', error);
    throw new Error('Could not retrieve token');
  }
};
