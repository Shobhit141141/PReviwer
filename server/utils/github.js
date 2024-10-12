import User from '../models/user.js';

export const getTokenByUsername = async (username) => {
  try {
    console.log("username: ", username)
    const user = await User.findOne({ username });
    console.log("user: ", user)
    if (user) {
      const accessToken = user.decryptAccessToken(); 
      console.log("accesstoken: " ,accessToken)
      return accessToken;
    }

    return null;
  } catch (error) {
    console.error('Error fetching token by username:', error);
    throw new Error('Could not retrieve token');
  }
};
