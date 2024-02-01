const responseUtils = require('../utils/responseUtils');
const Product = require('../models/product');
const { parseBodyJson, isJson } = require('../utils/requestUtils');

/** Send all products as JSON
 * 
 * @param {http.ServerResponse} response response to be sent to the client
 * @returns {JSON} response data in JSON format
 */
const getAllProducts = async response => {
  const data = await Product.find({});
  return responseUtils.sendJson(response, data, 200);
};

/** Create a new product. Send created product as JSON
 * 
 * @param {http.ServerResponse} response response to be sent to the client 
 * @param {http.IncomingMessage} request request from the client 
 * @returns {JSON} response data in JSON format
 */
const addProduct = async (response, request) => {
  try {
    const body = await parseBodyJson(request);

    const { price, name, image, description } = body;

    if(!name || !price){
      return responseUtils.badRequest(response, "No name or price given!");
    }

    const product = new Product({
      name,
      image,
      description,
      price
    });
    
    const savedProduct = await product.save();
    
    return responseUtils.sendJson(response, savedProduct, 201);
  } catch (error) {
    return responseUtils.sendJson(response, error.message, 400);
  }
};

/** Send product by id as JSON
 * 
 * @param {http.ServerResponse} response response to be sent to the client 
 * @param {int} id the id of wanted product
 * @returns {JSON} response data in JSON format
 */
const getProduct = async (response, id) => {
  try {
    const product = await Product.findById(id);
    if(!product){
      return responseUtils.sendJson(response, "Not found", 404);
    } 
    return responseUtils.sendJson(response, product, 200);
  } catch (error) {
    return responseUtils.sendJson(response, error.message, 400);
  }
};

/** Update product. Send product as JSON
 * 
 * @param {int} _id the id of to be updated product
 * @param {http.ServerResponse} response response to be sent to the client
 * @param {http.IncomingMessage} request request from the client
 * @returns {JSON} response data in JSON format
 */
const updateProduct = async (_id, response, request) => {
  try {

    const { price, name, description, image } = await parseBodyJson(request);

    if (!name || !price) {
      return responseUtils.badRequest(response, "No required name or price", 400);
    }

    const updatedObject = {id: _id, price: price, name: name};

    if (description){
      updatedObject.description = description;
    }
    if (image){
      updatedObject.image = image;
    }

    const product = await Product.findByIdAndUpdate(_id, updatedObject, { new: true, timeout: 20000 });
    
    if(!product){
      return responseUtils.notFound(response);
    }
    return responseUtils.sendJson(response, product, 200);
  } catch (error) {
    return responseUtils.sendJson(response, error.message, 400);
  }
};


/** Delete product. Send deleted product as JSON
 * 
 * @param {int} _id the id of to be deleted product
 * @param {http.ServerResponse} response response to be sent to the client 
 * @returns {JSON} response data in JSON format
 */
const deleteProduct = async (_id, response) => {
  try {
    const product = await Product.findByIdAndDelete(_id);
    
    if (!product) {
      return responseUtils.sendJson(response, "Product not found", 404);
    }

    return responseUtils.sendJson(response, product, 200);
  } catch (error) {
    console.log(error);
    return responseUtils.sendJson(response, error.message, 404);
  }
};

module.exports = { getAllProducts, addProduct, getProduct, updateProduct, deleteProduct };