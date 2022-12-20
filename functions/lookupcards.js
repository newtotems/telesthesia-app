const faunadb = require("faunadb");

exports.handler = async function(event, context) {
  // Create a new FaunaDB client
  const client = new faunadb.Client({
    secret: process.env.DB_SECRT
  });

  // Retrieve the list of ID numbers from the query string parameters
  const values = event.queryStringParameters.ids;
  // Parse the values as an array of integers
  const valuesArray = values.split(',').map(val => parseInt(val, 10));
  // Create a new array called "firstFive" that contains the first 5 elements of valuesArray
  const firstFive = valuesArray.slice(0, 5);


  try {
    // Query FaunaDB to get the documents with the specified ID numbers in the 'cards' collection
    const result = await client.query(
      faunadb.query.Map(
        faunadb.query.Filter(
          valuesArray,
          faunadb.query.Lambda(
            "id",
            faunadb.query.Get(
              faunadb.query.Match(
                faunadb.query.Index("cards_by_id"),
                faunadb.query.Var("id")
              )
            )
          )
        ),
        faunadb.query.Lambda("X", faunadb.query.Get(faunadb.query.Var("X")))
      )
    );

    // Extract the data from the result
    const data = result.data.map(doc => {
      // Add up the values in the 'scores' object and store the total in a new property called 'individualvalue'
      let individualvalue = Object.values(doc.data.scores).reduce((acc, curr) => acc + curr, 0);
      return { ...doc.data, individualvalue };
    });

    // Add up the 'individualvalue' values for all documents and store the result in 'allvalues'
    let allvalues = data.reduce((acc, curr) => acc + curr.individualvalue, 0);

         // Iterate over the documents in the 'data' array
         data.forEach(doc => {
            if (doc.rules) {
              // Iterate over the keys in the 'rules' object
              Object.keys(doc.rules).forEach(key => {
                const rule = doc.rules[key];
    
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
    