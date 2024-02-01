const addToCart = productId => {
  // TODO 9.2
  // use addProductToCart(), available already from /public/js/utils.js
  // call updateProductAmount(productId) from this file
  try {
    addProductToCart(productId);
    updateProductAmount(productId);
  } catch (error) {
    console.error(error);
  } 
};

const decreaseCount = productId => {
  // TODO 9.2
  // Decrease the amount of products in the cart, /public/js/utils.js provides decreaseProductCount()
  // Remove product from cart if amount is 0,  /public/js/utils.js provides removeElement = (containerId, elementId
  const count = decreaseProductCount(productId);
  if (count === 0) {
    removeElement('cart-container', productId);
  } else {
    updateProductAmount(productId);
  }
};

const updateProductAmount = productId => {
  // TODO 9.2
  // - read the amount of products in the cart, /public/js/utils.js provides getProductCountFromCart(productId)
  // - change the amount of products shown in the right element's innerText
  const count = getProductCountFromCart(productId);

  // Update the product amount in the UI
  const amountElement = document.getElementById(`amount-${productId}`);
  amountElement.innerText = `${count}x`;
};

const placeOrder = async() => {
  // TODO 9.2
  // Get all products from the cart, /public/js/utils.js provides getAllProductsFromCart()
  // show the user a notification: /public/js/utils.js provides createNotification = (message, containerId, isSuccess = true)
  // for each of the products in the cart remove them, /public/js/utils.js provides removeElement(containerId, elementId)
  const productsInCart = getAllProductsFromCart();

  // Show a success notification for placing an order
  createNotification('Successfully created an order!', 'notifications-container', true);

  // Clear the shopping cart and remove cart items from the UI
  clearCart();
  productsInCart.forEach((product) => {
    removeElement('cart-container', product.name);
  });
};

(async() => {
  // TODO 9.2
  // - get the 'cart-container' element
  // - use getJSON(url) to get the available products
  // - get all products from cart
  // - get the 'cart-item-template' template
  // - for each item in the cart
  //    * copy the item information to the template
  //    * hint: add the product's ID to the created element's as its ID to 
  //        enable editing ith 
  //    * remember to add event listeners for cart-minus-plus-button
  //        cart-minus-plus-button elements. querySelectorAll() can be used 
  //        to select all elements with each of those classes, then its 
  //        just up to finding the right index.  querySelectorAll() can be 
  //        used on the clone of "product in the cart" template to get its two
  //        elements with the "cart-minus-plus-button" class. Of the resulting
  //        element array, one item could be given the ID of 
  //        `plus-${product_id`, and other `minus-${product_id}`. At the same
  //        time we can attach the event listeners to these elements. Something 
  //        like the following will likely work:
  //          clone.querySelector('button').id = `add-to-cart-${prodouctId}`;
  //          clone.querySelector('button').addEventListener('click', () => addToCart(productId, productName));
  //
  // - in the end remember to append the modified cart item to the cart 
  const cartContainer = document.getElementById('cart-container');
  const cartTemplate = document.getElementById('cart-item-template');
  
  const products = await getJSON("/api/products");
  const cartItems = getAllProductsFromCart();

  cartItems.forEach(cartItem => {
    const product = products.find(product => product._id === cartItem.name);
    if (product) {
      const cartItemClone = document.importNode(cartTemplate.content, true);
      const productElement = cartItemClone.querySelector('.item-row');
      const productNameElement = cartItemClone.querySelector('.product-name');
      const productPriceElement = cartItemClone.querySelector('.product-price');
      const productAmountElement = cartItemClone.querySelector('.product-amount');
      const plusButton = cartItemClone.querySelectorAll('.cart-minus-plus-button')[0];
      const minusButton = cartItemClone.querySelectorAll('.cart-minus-plus-button')[1];

      productNameElement.textContent = product.name;
      productPriceElement.textContent = `${product.price}`;
      productAmountElement.textContent = `${cartItem.amount}x`;
  
      productElement.id = product._id;
      productNameElement.id = `name-${product._id}`;
      productPriceElement.id = `price-${product._id}`;
      productAmountElement.id = `amount-${product._id}`;
      plusButton.id = `plus-${product._id}`;
      minusButton.id = `minus-${product._id}`;
      
      plusButton.addEventListener('click', () => {
        addToCart(product._id, product.name);
      });
      
      minusButton.addEventListener('click', () => {
        decreaseCount(product._id);
      });
      
      cartContainer.appendChild(cartItemClone);
    }
    
  });

  const placeOrderButton = document.getElementById('place-order-button');
  placeOrderButton.addEventListener('click', placeOrder);
})();