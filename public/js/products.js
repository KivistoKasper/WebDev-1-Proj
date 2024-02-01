const addToCart = (productId, productName) => {
  console.log(productId, productName);
  // TODO 9.2
  // you can use addProductToCart(), available already from /public/js/utils.js
  // for showing a notification of the product's creation, /public/js/utils.js  includes createNotification() function
  try {
    addProductToCart(productId);
    createNotification(`Added ${productName} to cart!`, 'notifications-container');
  } catch (error) {
    console.error(error);
    createNotification(`Addeing product to cart failed`, 'notifications-container', false);
  }
};

(async() => {
  //TODO 9.2 
  // - get the 'products-container' element from the /products.html
  // - get the 'product-template' element from the /products.html
  // - save the response from await getJSON(url) to get all the products. getJSON(url) is available to this script in products.html, as "js/utils.js" script has been added to products.html before this script file 
  // - then, loop throug the products in the response, and for each of the products:
  //    * clone the template
  //    * add product information to the template clone
  //    * remember to add an event listener for the button's 'click' event, and call addToCart() in the event listener's callback
  // - remember to add the products to the the page
  const productsContainer = document.getElementById('products-container');
  const productTemplate = document.getElementById('product-template');
  
  const products = await getJSON("/api/products");

  products.forEach(product => {
    const productClone = document.importNode(productTemplate.content, true);
    const productNameElement = productClone.querySelector('.product-name');
    const productDescriptionElement = productClone.querySelector('.product-description');
    const productPriceElement = productClone.querySelector('.product-price');
    const addToCartButton = productClone.querySelector('button');

    productNameElement.textContent = product.name;
    productDescriptionElement.textContent = product.description;
    productPriceElement.textContent = product.price;

    productNameElement.id = `name-${product._id}`;
    productDescriptionElement.id = `description-${product._id}`;
    productPriceElement.id = `price-${product._id}`;
    addToCartButton.id = `add-to-cart-${product._id}`;

    // Event listener
    addToCartButton.addEventListener('click', () => {
      addToCart(product._id, product.name);
    });

    // Append the product element
    productsContainer.appendChild(productClone);
  });
})();