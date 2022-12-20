const faunadb = require("faunadb");

exports.handler = async function(event, context) {
  // Create a new FaunaDB client
  const client = new faunadb.Client({
    secret: process.env.DB_SECRT
  });

  // Query FaunaDB to get all documents in the 'cards' collection
  const result = await client.query(
    faunadb.query.Map(
      // Get all documents in the 'cards' collection
      faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index("all_cards"))),
      // Map over each document and return the data
      faunadb.query.Lambda("X", faunadb.query.Get(faunadb.query.Var("X")))
    )
  );

  // Extract the data from the result
  const data = result.data.map(doc => doc.data);

  // Return the data as the response to the function
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};
