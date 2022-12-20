const faunadb = require("faunadb");
const q = faunadb.query;

exports.handler = async (event, context) => {
  // Get the FaunaDB secret and the query parameter called "ids"
  const secret = process.env.DB_SECRT;
  const ids = event.queryStringParameters.ids;

  // Parse the ids as an array of numbers
  const idsArray = ids.split(',').map(id => parseInt(id, 10));

  // Connect to FaunaDB using the secret
  const client = new faunadb.Client({ secret });

  try {
    // Query the cards collection to find all records with an ID that is in the idsArray
    const response = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index("cards_by_id"), idsArray)),
        q.Lambda("X", q.Get(q.Var("X")))
      )
    );

    // Log a message indicating whether any matches were found
    if (response.data.length > 0) {
      console.log("Found matches for IDs:", idsArray);
    } else {
      console.log("No matches found for IDs:", idsArray);
    }

    // Return a response with the results as the body
    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    // Return an error response if something goes wrong
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
