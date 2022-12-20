const faunadb = require("faunadb");

exports.handler = async function(event, context) {
  // Create a new FaunaDB client
  const client = new faunadb.Client({
    secret: process.env.DB_SECRT
  });

  try {
    // Query FaunaDB to get all documents in the 'cards' collection
    const result = await client.query(
      faunadb.query.Map(
        faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index("all_cards"))),
        faunadb.query.Lambda("X", faunadb.query.Get(faunadb.query.Var("X")))
      )
    );

    // Extract the data from the result
    const data = result.data.map(doc => {
      // Add up the values in the 'scores' object and store the total in a new property called 'totalscores'
      let totalscores = Object.values(doc.data.scores).reduce((acc, curr) => acc + curr, 0);

      // Check if the document has a 'rules' object
      if (doc.data.rules) {
        // Iterate over the keys in the 'rules' object
        Object.keys(doc.data.rules).forEach(key => {
          const rule = doc.data.rules[key];

          // Check the 'type' of the rule
          if (rule.type === "additive") {
            // Check if the 'criteria' of the rule is satisfied
            if (rule.criteria.type === doc.data.type) {
              // Adjust the 'totalscores' value based on the 'value' of the rule
              totalscores += rule.value;
            }
          } else if (rule.type === "subtractive") {
            // Check if the 'criteria' of the rule is satisfied
            if (rule.criteria.type === doc.data.type) {
              // Adjust the 'totalscores' value based on the 'value' of the rule
              totalscores -= rule.value;
            }
          }
        });
      }

      return { ...doc.data, totalscores };
    });

    // Add up the 'totalscores' values for all documents and store the result in 'overallscore'
    let overallscore = 0;
    data.forEach(doc => {
      // Iterate over the keys in the 'rules' object
      if (doc.rules) {
        Object.keys(doc.rules).forEach(key => {
          const rule = doc.rules[key];

          // Check the 'type' of the rule
          if (rule.type === "additive") {
            // Check if the 'criteria' of the rule is satisfied
            if (rule.criteria.type === doc.type) {
              // Adjust the 'overallscore' value based on the 'value' of the rule
              overallscore += rule.value;
            }
          } else if (rule.type === "subtractive") {
            // Check if the 'criteria' of the rule is satisfied
            if (rule.criteria.type === doc.type) {
              // Adjust the 'overallscore' value based on the 'value' of the rule
              overallscore -= rule.value;
            }
          }
        });
      }
    });

    // Return the 'overallscore'
    return {
      statusCode: 200,
      body: JSON.stringify({ overallscore })
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
