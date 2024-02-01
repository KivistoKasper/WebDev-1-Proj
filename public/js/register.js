/**
 * TODO: 8.4 Register new user
 *       - Handle registration form submission
 *       - Prevent registration when password and passwordConfirmation do not match
 *       - Use createNotification() function from utils.js to show user messages of
 *       error conditions and successful registration
 *       - Reset the form back to empty after successful registration
 *       - Use postOrPutJSON() function from utils.js to send your data back to server
 */

// Handle registration form submission
const registrationForm = document.getElementById('register-form'); 

// event listener for submit button
document.getElementById('btnRegister').addEventListener("click", async function(event){
  event.preventDefault();

  // get user input data 
  const username = document.getElementById('name').value; 
  const email = document.getElementById('email').value; 
  const password = document.getElementById('password').value; 
  const passwordConfirmation = document.getElementById('passwordConfirmation').value; 

  // Prevent registration when passwords do not match
  if (password !== passwordConfirmation) {
    createNotification('Passwords do not match!', 'notifications-container', false);
    return;
  }    

  // data to be sent
  var data = {
    "name": username,
    "email": email,
    "password": password,
  };
  
  try {
    const response = await postOrPutJSON('http://localhost:3000/api/register', 'POST', data);
    console.log('Response Status Code:', response.status);

    console.log(response);
    if (response.statusCode === 201) {
      createNotification('Registration successful!', 'notifications-container');
      // Reset the form back to empty after successful registration
      registrationForm.reset();
    } else {
      createNotification('Registration failed!', 'notifications-container', false);
    }
  } catch (error) {
    console.error(error);
    createNotification('An error occurred during registration', 'error');
  }
});





