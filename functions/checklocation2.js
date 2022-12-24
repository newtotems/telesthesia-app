const faunadb = require('faunadb')

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
})

exports.handler = async (event, context) => {
  // Check if the 'locations_by_latlong' index exists
  const result = await client.query(
    faunadb.query.Exists(faunadb.query.Index('locations_by_latlong'))
  )

  // Check if the index exists
  if (result.data) {
    // Return 'true' if the index exists
    return {
      statusCode: 200,
      body: JSON.stringify(true)
    }
  } else {
    // If the index does not exist, get a random negative response from the 'all_negative_responses' collection
    const negativeResult = await client.query(
      faunadb.query.Get(
        faunadb.query.Random(faunadb.query.Match(faunadb.query.Index('all_negative_responses')))
      )
    )

    // Return the 'text' field from the random negative response
    return {
      statusCode: 200,
      body: JSON.stringify({
        text: negativeResult.data.text
      })
    }
  }
}
