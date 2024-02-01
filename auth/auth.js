const { getCredentials } = require('../utils/requestUtils');

// require user model
const User = require("../models/user");
/**
 * Get current user based on the request headers
 *
 * @param {http.IncomingMessage} request request to be checked
 * @returns {object|null} current authenticated user or null if not yet authenticated
 */
const getCurrentUser = async request => {
  // Get user credentials
  const credentials = getCredentials(request);

  if (!credentials) {
    return null;
  }

  // set variables
  const [email, password] = credentials;

  // find one user with an email "email@email.com"
  const user = await User.findOne({ email: email }).exec();
  if (!user) {
      return null;
    }

    // check password
    const isPasswordCorrect = await user.checkPassword(password);

    if (!isPasswordCorrect) {
      return null;
    }

    return user;
  
};

module.exports = { getCurrentUser };