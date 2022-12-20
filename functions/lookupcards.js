const faunadb = require("faunadb");
const q = faunadb.query;

exports.handler = async (event, context) => {
  // Get the FaunaDB secret and the query parameter called "ids"
  const secret = process.env.FAUNADB_SECRET;
  const ids = event.queryStringParameters.ids;

  // Parse the ids as an array of numbers
  const idsArray = ids.split(',').map(id => parseInt(id, 10));

  // Connect to FaunaDB using the secret
  const client = new faunadb.Client({ secret });

  try {
    // Query the cards collection to find all records with an ID that is in the idsArray
    const response = await client.query(
      q.Map(
        idsArray,
        q.Lambda("id", q.Match(q.Index("cards_by_id"), q.Var("id")))
      )
    );

    // Combine the results into a single array using the Union function
    const data = q.Union(response);

    // Log a message indicating whether any matches were found
    if (data.length > 0) {
      console.log("Found matches for IDs:", idsArray);
    } else {
      console.log("No matches found for IDs:", idsArray);
    }

    // Return a response with the results as the body
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    // Return an error response if something goes wrong
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
