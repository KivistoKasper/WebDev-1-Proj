const responseUtils = require('./utils/responseUtils');
const { acceptsJson, isJson, parseBodyJson } = require('./utils/requestUtils');
const { renderPublic } = require('./utils/render');
//const { emailInUse, getAllUsers, saveNewUser, validateUser, getUserById, deleteUserById } = require('./utils/users');
const { getCurrentUser } = require('./auth/auth');
const User = require("./models/user"); // user database
const { getAllProducts, addProduct, getProduct, updateProduct, deleteProduct } = require('./controllers/products');
const { getAllUsers, registerUser, deleteUser, viewUser, updateUser } = require('./controllers/users');
const { getAllOrders, getOrder, addNewOrder } = require('./controllers/orders');

//Reading products
//const products = require('./products.json').map(product => ({...product }));

/**
 * Known API routes and their allowed methods
 *
 * Used to check allowed methods and also to send correct header value
 * in response to an OPTIONS request by sendOptions() (Access-Control-Allow-Methods)
 */
const allowedMethods = {
  '/api/register': ['POST'],
  '/api/users': ['GET', 'PUT', 'DELETE'],
  '/api/products': ['GET', 'POST', 'PUT', 'DELETE'],
  '/api/orders': ['GET', 'POST']
};

/**
 * Send response to client options request.
 *
 * @param {string} filePath pathname of the request URL
 * @param {http.ServerResponse} response response to be sent to the client
 * @returns {http.ServerResponse} response with options
 */
const sendOptions = (filePath, response) => {
  if (filePath in allowedMethods) {
    response.writeHead(204, {
      'Access-Control-Allow-Methods': allowedMethods[filePath].join(','),
      'Access-Control-Allow-Headers': 'Content-Type,Accept',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': 'Content-Type,Accept'
    });
    return response.end();
  }

  return responseUtils.notFound(response);
};

/**
 * Does the url have an ID component as its last part? (e.g. /api/users/dsf7844e)
 *
 * @param {string} url filePath
 * @param {string} prefix prefix to direct the url
 * @returns {boolean} true if the url has and ID component
 */
const matchIdRoute = (url, prefix) => {
  const idPattern = '[0-9a-z]{8,24}';
  const regex = new RegExp(`^(/api)?/${prefix}/${idPattern}$`);
  return regex.test(url);
};

/**
 * Does the URL match /api/users/{id}
 *
 * @param {string} url filePath
 * @returns {boolean} true if URL matches 
 */
const matchUserId = url => {
  return matchIdRoute(url, 'users');
};

const handleRequest = async (request, response) => {
  const { url, method, headers } = request;
  const filePath = new URL(url, `http://${headers.host}`).pathname;
  const rawPath = filePath.split('/').length === 4 ? filePath.split('/').slice(0, -1).join('/') : filePath;

  // serve static files from public/ and return immediately
  if (method.toUpperCase() === 'GET' && !filePath.startsWith('/api')) {
    const fileName = filePath === '/' || filePath === '' ? 'index.html' : filePath;
    return renderPublic(fileName, response);
  }

  // Default to 404 Not Found if unknown url
  if (!(rawPath in allowedMethods)) return responseUtils.notFound(response);

  // See: http://restcookbook.com/HTTP%20Methods/options/
  if (method.toUpperCase() === 'OPTIONS') return sendOptions(filePath, response);

  // Check for allowable methods
  if (!allowedMethods[rawPath].includes(method.toUpperCase())) {
    return responseUtils.methodNotAllowed(response);
  }
  if(matchUserId(filePath)){
    return handleUsersIdRoute(filePath, request, response);   
  } else if (rawPath === '/api/users'){
    return handleUsersRoute(request, response);
  } else if (rawPath === '/api/products') {
    return handleProductsRoute(filePath, request, response);
  } else if (rawPath === '/api/orders') {
    return handleOrdersRoute(filePath, request, response);
  } else if (rawPath === '/api/register') {
    return handleRegisterRoute(request, response);
  }else{
    return response.writeHead(421).end();
  }
};

/** Handle te users commands for viewing, updatating and deleting users
 * 
 * @param {string} filePath filepath of the user to be handled 
 * @param {http.IncomingMessage} request the request made by client
 * @param {http.ServerResponse} response response to be sent to the client
 * @returns {http.ServerResponse} response of the action
 */
const handleUsersIdRoute = async(filePath, request, response) => {

  const currentUser = await getCurrentUser(request);
  if (!currentUser) {
    responseUtils.basicAuthChallenge(response);
  } else if (currentUser.role !== 'admin'){
    responseUtils.forbidden(response);
  } else {
    if (!acceptsJson(request)) {
      return responseUtils.contentTypeNotAcceptable(response);
    }
      // basic information
      const parts = filePath.split('/');
      const id = parts[parts.length - 1];
      const user = await User.findById(id).exec();
      // view user
    if(request.method.toUpperCase() === 'GET'){
      if(!user){
        responseUtils.notFound(response);
      }else{
        viewUser(response, id, currentUser); // view user
      }
    }
    // update user
    else if(request.method.toUpperCase() === 'PUT'){
      if(!user){
        responseUtils.notFound(response);
      } else {
        const body = await parseBodyJson(request);
        const status = await updateUser(response, id, currentUser, body); // update user
        return status;
      }
    }
    
    // delete user
    else if(request.method.toUpperCase() === 'DELETE'){
      if(!user){
        responseUtils.notFound(response);
      }else {
        const status = await deleteUser(response, id, currentUser);
      }
    }
  }

};

/** Handle getting all the users
 * 
 * @param {http.IncomingMessage} request the request made by client 
 * @param {http.ServerResponse} response response to be sent to the client
 * @returns {http.ServerResponse} response of the action, either all the users or an error code
 */
const handleUsersRoute = async (request, response) => {
  // Require a correct accept header (require 'application/json' or '*/*')
  if (!acceptsJson(request)) {
    return responseUtils.contentTypeNotAcceptable(response);
  }

  const currentUser = await getCurrentUser(request);
  if (request.method.toUpperCase() === 'GET') {
    if (!currentUser) {
      responseUtils.basicAuthChallenge(response);
    } else if (currentUser.role !== 'admin') {
      responseUtils.forbidden(response);
    } else { 
      getAllUsers(response);
    }
  } 
};

/** Handle all the product commands ex. viewing or deleting
 * 
 * @param {string} filePath filepath of the product to be handled
 * @param {http.IncomingMessage} request the request made by client 
 * @param {http.ServerResponse} response response to be sent to the client
 * @returns {http.ServerResponse} response of the action with status code and body
 */
const handleProductsRoute = async (filePath, request, response) => {
  const currentUser = await getCurrentUser(request);
  const parts = filePath.split('/');
  let id;
  if(parts.length === 4){
    id = parts[parts.length - 1];
  }else{
    id = null;
  }
  if (request.method.toUpperCase() === 'PUT'){

    if (!currentUser) {
      return responseUtils.basicAuthChallenge(response);
    } else if (currentUser.role !== 'admin' && currentUser.role !== 'customer') {
      return responseUtils.forbidden(response);
    }
    if (!acceptsJson(request)) {
    return responseUtils.contentTypeNotAcceptable(response);
  }
    if(currentUser.role === 'admin'){
      await updateProduct(id, response, request);
    }else{
      return responseUtils.forbidden(response);
    }
  }

  if (!acceptsJson(request)) {
    return responseUtils.contentTypeNotAcceptable(response);
  }
  if (!currentUser) {
    return responseUtils.basicAuthChallenge(response);
  } else if (currentUser.role !== 'admin' && currentUser.role !== 'customer') {
    return responseUtils.forbidden(response);
  }
  if (request.method.toUpperCase() === 'GET') {
    if(id) {
      getProduct(response, id);
    } else {
      getAllProducts(response);
    }
  } else if (request.method.toUpperCase() === 'POST') {
    if(currentUser.role === 'admin'){
      addProduct(response, request);
    }else{
      return responseUtils.forbidden(response);
    }
  } else if (request.method.toUpperCase() === 'DELETE') {
    if(currentUser.role === 'admin'){
      deleteProduct(id, response);
    }else{
      return responseUtils.forbidden(response);
    }
  }

};

/** Handle all the order commands ex. viewing or deleting
 * 
 * @param {string} filePath filepath of the order to be handled 
 * @param {http.IncomingMessage} request the request made by client 
 * @param {http.ServerResponse} response response to be sent to the client 
 * @returns {http.ServerResponse} response of the action with status code and body
 */
const handleOrdersRoute = async (filePath, request, response) => {
  // Require a correct accept header (require 'application/json' or '*/*')
  if (!acceptsJson(request)) {
    return responseUtils.contentTypeNotAcceptable(response);
  }
  const currentUser = await getCurrentUser(request);
  const parts = await filePath.split('/');
  let id;
  if(parts.length === 4){
    id = parts[parts.length - 1];
  }

  if (!currentUser) {
    return responseUtils.basicAuthChallenge(response);
  } else if (currentUser.role !== 'admin' && currentUser.role !== 'customer') {
    return responseUtils.forbidden(response);
  }

  const method = await request.method.toUpperCase();

  if (method === 'GET') {
    if (id) {
      getOrder(response, request, id);
    } else {
      getAllOrders(response, request);
    }
  } else if (method === 'POST') {
    addNewOrder(request, response);
  }
};

/** Handle registering a new user
 * 
 * @param {http.IncomingMessage} request the request made by client 
 * @param {http.ServerResponse} response response to be sent to the client 
 * @returns {http.ServerResponse} response of the action with status code and body 
 */
const handleRegisterRoute = async (request, response) => {
  // Require a correct accept header (require 'application/json' or '*/*')
  if (!acceptsJson(request)) {
    return responseUtils.contentTypeNotAcceptable(response);
  }
  if (request.method.toUpperCase() === 'POST') {
    if (!isJson(request)) {
      return responseUtils.badRequest(response, 'Invalid Content-Type. Expected application/json');
    }

    try {
      const NewUser = await parseBodyJson(request);
      await registerUser(response, NewUser);
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = { handleRequest };