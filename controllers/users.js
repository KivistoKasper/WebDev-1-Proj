const responseUtils = require('../utils/responseUtils');
const User = require('../models/user');

/** Send all users as JSON
 * 
 * @param {http.ServerResponse} response response to be sent to the client
 * @returns {JSON} response data in JSON format
 */
const getAllUsers = async response => {
  
  const users = await User.find({});
  return responseUtils.sendJson(response, users);
};


/** Delete user and send deleted user as JSON
 * 
 * @param {http.ServerResponse} response response to be sent to the client
 * @param {string} userId User id of user to be deleted
 * @param {object} currentUser Current user asking the command (mongoose document object)
 * @returns {JSON} response data in JSON format
 */
const deleteUser = async(response, userId, currentUser) => {
  
  if ( currentUser._id.equals(userId) ){ // stopping from deleting itself
    response.write("{\"error\": \"Deleting own data is not allowed\"}");
    response.setHeader('Content-Type', 'application/json');
    return responseUtils.badRequest(response);
  }
  else {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser){
      return responseUtils.notFound(response);
    } 
    else{
      return responseUtils.sendJson(response, deletedUser); // delete user
    }
  }
};

/** Update user and send updated user as JSON
 * 
 * @param {http.ServerResponse} response response to be sent to the client
 * @param {string} userId User id of user to be updated
 * @param {object} currentUser Current user asking the command (mongoose document object)
 * @param {object} userData JSON data from request body
 * @returns {JSON} response data in JSON format
 */
const updateUser = async(response, userId, currentUser, userData) => {

  if ( !currentUser._id.equals(userId) ){ // stopping from updating itself

    const user = await User.findById(userId);
    if (!user){ // no user found with id
      return responseUtils.notFound(response);
    }
    else if (!userData.role){ // role missing
      return responseUtils.badRequest(response, "Missing role");
    }
    else if(userData.role !== 'admin' && userData.role !== 'customer'){ // invalid role
      return responseUtils.badRequest(response, "Role is not correct");
    }
    else {
      // change user's role 
      const updatedUser = await User.findOneAndUpdate({_id : userId}, {role : userData.role}, {
        returnOriginal: false
        });
        return responseUtils.sendJson(response, updatedUser); // update user
    }
    
  }else{
    response.write("{\"error\": \"Updating own data is not allowed\"}");
    response.setHeader('Content-Type', 'application/json');
    return responseUtils.badRequest(response);
  }
  
};

/** Send user data as JSON
 *
 * @param {http.ServerResponse} response response to be sent to the client
 * @param {string} userId User id of wanted user
 * @param {object} currentUser Current user asking the command (mongoose document object)
 * @returns {JSON} response data in JSON format
 */
const viewUser = async(response, userId, currentUser) => {
  
  if(currentUser.role !== 'admin'){
    return responseUtils.forbidden(response);
  }
  else {
    const user = await User.findById(userId);
    if(!user){
      return responseUtils.notFound(response);
    }
    else {
      return responseUtils.sendJson(response, user); // send user
    }
  }
  
  
};

// constants for user roles
const data = { 
  roles: ['customer', 'admin']
};

function validateEmail(email) {
  // Regular expression for a basic email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Test the email against the pattern
  return emailPattern.test(email);
}

/** Validate user object (Very simple and minimal validation)
 * 
 * This function can be used to validate that user has all required
 * fields before saving it. 
 * @param {object} user user object to be validated
 * @returns {Array<string>} Array of error messages or empty array if user is valid. 
 */
const validateUser = user => {
  const errors = [];

  if (!user.name) errors.push('Missing name');
  if (!user.email) errors.push('Missing email');
  else if(!validateEmail(user.email)) errors.push('Invalid email');
  if (!user.password) errors.push('Missing password');
  else if (user.password.length < 10) errors.push('Too short password');
  if (user.role && !data.roles.includes(user.role)) errors.push('Unknown role');

  return errors;
};



/** Register new user and send created user back as JSON
 * 
 * @param {http.ServerResponse} response response to be sent to the client
 * @param {object} userData JSON data from request body
 * @returns {JSON} response data in JSON format
 */
const registerUser = async(response, userData) => {

  // Validate the user data
  const validationErrors = validateUser(userData);
  if (validationErrors.length > 0) {
    return responseUtils.badRequest(response, validationErrors.join(', '));
  }

  // Check if the email is already in use
  // find one user with an email "email@email.com"
  const emailInUse = await User.findOne({ email: userData.email }).exec();
  if (!userData.email || emailInUse) {
    return responseUtils.badRequest(response, 'Email is already in use');
  }

  const user = {...userData};
  user.role = 'customer';
  const newUser = new User(user);
  await newUser.save();
  return responseUtils.createdResource(response, newUser);
};

module.exports = { getAllUsers, registerUser, deleteUser, viewUser, updateUser };