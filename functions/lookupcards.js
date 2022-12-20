const faunadb = require("faunadb");
const q = faunadb.query;

exports.handler = async (event, context) => {
  // Get the FaunaDB secret and the query parameter called "names"
  secret: process.env.DB_SECRT
  const names = event.queryStringParameters.names;

  // Parse the names as an array
  const namesArray = names.split(',');

  // Connect to FaunaDB using the secret
  const client = new faunadb.Client({ secret });

  try {
    // Query the cards collection to find all records with a name that is in the namesArray
    const response = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index("cards_by_name"), namesArray)),
        q.Lambda("X", q.Get(q.Var("X")))
      )
    );

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
