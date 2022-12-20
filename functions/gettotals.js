const faunadb = require("faunadb");

exports.handler = async function(event, context) {
  // Create a new FaunaDB client
  const client = new faunadb.Client({
    secret: process.env.DB_SECRT
  });

  // Get the 'ids' query parameter from the event object
  const { ids } = event.queryStringParameters;

  // Split the 'ids' string into an array of individual ID values
  if (typeof ids === 'string') {
    const idArray = ids.split(",");
  } else {
    ids = String(ids);
    const idArray = ids.split(",");
  }

  // Query FaunaDB to get all documents in the 'cards' collection with an ID in the array of values
  const result = await client.query(
    faunadb.query.Map(
      // Get all documents in the 'cards' collection where the 'id' value is in the array
      faunadb.query.Filter(
        faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index("all_cards"))),
        faunadb.query.Lambda("X", faunadb.query.Contains(idArray, faunadb.query.Select("id", faunadb.query.Get(faunadb.query.Var("X"))))))
      // Map over each document and return the data
      ,faunadb.query.Lambda("X", faunadb.query.Get(faunadb.query.Var("X")))
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
