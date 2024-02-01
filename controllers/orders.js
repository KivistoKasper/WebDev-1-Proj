const responseUtils = require('../utils/responseUtils');
const Order = require('../models/order');
const { getCurrentUser } = require('../auth/auth');
const { parseBodyJson, isJson } = require('../utils/requestUtils');


/**Return orders as JSON
 * 
 * @param {http.ServerResponse} response response to be sent to the client
 * @param {http.IncomingMessage} request request from the client
 * @returns {JSON} response data in JSON format
 */
const getAllOrders = async (response, request) => {
  try {
    const user = await getCurrentUser(request);
    let orders;

    if (!user.role) {
      return responseUtils.badRequest(response, "Missing role");
    }

    if (user.role === 'admin') {
      orders = await Order.find({});
    } else {
      orders = await Order.find({ customerId: user._id });
    }

    return responseUtils.sendJson(response, orders, 200);
  } catch (error) {
    return responseUtils.sendJson(response, error.message, 404);
  }
};


/**Return order by id as JSON
 * 
 * @param {http.ServerResponse} response response to be sent to the client
 * @param {http.IncomingMessage} request request from the client
 * @param {int} id oredr id to found
 * @returns {JSON} response data in JSON format
 */
const getOrder = async (response, request, id) => {
  try {
    const user = await getCurrentUser(request);
    let order;

    if (user.role === 'admin') {
      order = await Order.findById(id);
    } else {
      order = await Order.findOne({ _id: id, customerId: user._id });
    }

    if(!order){
      return responseUtils.sendJson(response, "Order not found", 404);
    } 
    return responseUtils.sendJson(response, order, 200);
  } catch (error) {
    return responseUtils.sendJson(response, error.message, 400);
  }
};


/** Add a new order
 * 
 * @param {http.IncomingMessage} request request from the client
 * @param {http.ServerResponse} response response to be sent to the client
 * @returns {JSON} response data in JSON format
 */
const addNewOrder = async (request, response) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return responseUtils.sendJson(response, 'User not found', 400);
    }

    const data = await parseBodyJson(request);
    if(data.items.length === 0) {
      return responseUtils.badRequest(response, 'Missing items', 403);
    }
    let missing = false;
    data.items.forEach(item => {
      if (!item.product || !item.product._id || !item.product.name || !item.product.price || !item.quantity) {
        missing = true;
      }
    });
    if (missing){
      return responseUtils.badRequest(response, 'Missing required fields in item', 400);
    }
    const orderItems = data.items.map(item => {
      const orderItem = {
        product: {
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
        },
        quantity: item.quantity
      };
      if (item.product.description) {
        orderItem.product.description = item.product.description;
      }
      return orderItem;
    });

    if (user.role !== 'customer') {
      return responseUtils.forbidden(response);
    }

    const newOrder = new Order({
      customerId: user.id,
      items: orderItems
    });

    const savedOrder = await newOrder.save();
    return responseUtils.sendJson(response, savedOrder, 201);
  } catch (error) {
    return responseUtils.sendJson(response, error.message, 400);
  }
};

module.exports = { getAllOrders, getOrder, addNewOrder };