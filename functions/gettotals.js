const faunadb = require('faunadb');

// Replace with your own FaunaDB secret
const secret = 'YOUR_FAUNADB_SECRET';

// Create a FaunaDB client
const client = new faunadb.Client({ secret });

exports.handler = async (event) => {
  // Get the list of ids from the query parameter
  const ids = event.queryStringParameters.ids.split(',');

  // Read the records from the 'cards' collection based on the ids
  const results = await client.query(
    faunadb.query.Map(
      ids,
      (id) => faunadb.query.Get(faunadb.query.Ref(faunadb.query.Collection('cards'), id))
    )
  );

  // Return the records as the response
  return {
    statusCode: 200,
    body: JSON.stringify(results),
  };
};
