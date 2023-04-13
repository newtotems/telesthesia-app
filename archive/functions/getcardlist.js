const faunadb = require('faunadb');

exports.handler = async (event, context) => {
  const client = new faunadb.Client({
    secret: process.env.DB_SECRT
  });

  try {
    // Query FaunaDB to get all records in the 'cards' collection
    const result = await client.query(
      faunadb.query.Map(
        faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('all_cards'))),
        faunadb.query.Lambda('X', faunadb.query.Get(faunadb.query.Var('X')))
      )
    );

    // Extract the id and name values for each record
    const cardData = result.data.map(card => ({
      id: card.data.id,
      name: card.data.name
    }));

    // Return the card data as a JSON response
    return {
      statusCode: 200,
      body: JSON.stringify(cardData)
    };
  } catch (error) {
    // Return an error response if something went wrong
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
