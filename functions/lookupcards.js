const faunadb = require("faunadb");

exports.handler = async function(event, context) {
  // Create a new FaunaDB client
  const client = new faunadb.Client({
    secret: process.env.DB_SECRT
  });

  try {
    // Get the 'values' query parameter from the event object
    const values = event.queryStringParameters.values;

    // Parse the values as an array of integers
    const valuesArray = values.split(",").map(val => parseInt(val, 10));

    // Create a new array called "firstFive" that contains the first 5 elements of valuesArray as strings
    const firstFive = valuesArray.slice(0, 5).map(val => String(val));

    // Convert the strings in the 'firstFive' array to numbers
    const firstFiveNumbers = firstFive.map(val => Number(val));

    // Create a new array called 'idQueries' that contains a query for each ID in the 'firstFiveNumbers' array
    const idQueries = firstFiveNumbers.map(id => faunadb.query.Get(faunadb.query.Match(faunadb.query.Index("cards_by_id"), id)));

    // Query FaunaDB to get all documents in the 'cards' collection with an ID in the 'firstFiveNumbers' array
    const result = await client.query(
      faunadb.query.Map(
        // Use a union to combine all of the ID queries
        faunadb.query.Union(...idQueries),
        // Map over each document and return the data
        faunadb.query.Lambda("X", faunadb.query.Get(faunadb.query.Var("X")))
      )
    );

    // Extract the data from the result
    const data = result.data.map(doc => {
      // Add up the values in the 'scores' object and store the total in a new property called 'individualvalue'
      let individualvalue = Object.values(doc.data.scores).reduce((total, score) => total + score, 0);

      return { ...doc.data, individualvalue };
    });

    // Initialize the 'allvalues' variable to 0
    let allvalues = 0;

    // Iterate over the 'data' array
    data.forEach(doc => {
        // Add up the 'individualvalue' of each document to the 'allvalues' variable
        allvalues += doc.individualvalue;
  
        // Check if the document has a 'rules' property
        if (doc.rules) {
          // Iterate over the 'rules' array
          doc.rules.forEach(rule => {
            // Check the 'type' of the rule
            if (rule.type === "additive") {
              // Check if the 'criteria' of the rule is satisfied
              if (rule.criteria.type === doc.type) {
                // Adjust the 'allvalues' value based on the 'value' of the rule and the number of criteria instances
                allvalues += rule.value * Object.keys(doc.scores).length;
              }
            } else if (rule.type === "subtractive") {
              // Check if the 'criteria' of the rule is satisfied
              if (rule.criteria.type === doc.type) {
                // Adjust the 'allvalues' value based on the 'value' of the rule and the number of criteria instances
                allvalues -= rule.value * Object.keys(doc.scores).length;
              }
            }
          });
        }
      });
  
      // Return the 'individualvalue' array and the 'allvalues' score
      return {
        statusCode: 200,
        body: JSON.stringify({
          individualvalues: data.map(doc => doc.individualvalue),
          allvalues
        })
      };
    } catch (error) {
      // Log the error message
      console.error(error);
  
      // Return a server error response
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Error getting data from FaunaDB" })
      };
    }
  };
  