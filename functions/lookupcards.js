const { parse } = require("querystring");

exports.handler = async (event, context) => {
  // Get the query parameter called "values"
  const values = event.queryStringParameters.values;

  // Parse the values as an array of integers
  const valuesArray = values.split(',').map(val => parseInt(val, 10));

  // Create a new array called "firstFive" that contains the first 5 elements of valuesArray
  const firstFive = valuesArray.slice(0, 5);

  // Return a response with the firstFive array as the body
  return {
    statusCode: 200,
    body: JSON.stringify({firstFive})
  }
};
