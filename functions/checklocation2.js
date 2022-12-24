const faunadb = require('faunadb')

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
})

exports.handler = async (event, context) => {
  // Query the 'all_negative_responses' collection to get a random negative response
  const result = await client.query(
    faunadb.query.Get(
      faunadb.query.Random(faunadb.query.Match(faunadb.query.Index('all_negative_responses')))
    )
  )

  // Return the selected negative response
  return {
    statusCode: 200,
    body: JSON.stringify(result.data)
  }
}
