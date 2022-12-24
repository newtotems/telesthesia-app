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
    // If the index does not exist, get all negative responses from the 'all_negative_responses' collection
    const negativeResult = await client.query(
      faunadb.query.Map(
        // Get all documents from the 'all_negative_responses' collection
        faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('all_negative_responses'))),
        // Retrieve the document data for each negative response
        faunadb.query.Lambda((ref) => faunadb.query.Get(ref))
      )
    )

    // Select a random negative response from the list
    const randomIndex = Math.floor(Math.random() * negativeResult.data.length)
    const negativeResponse = negativeResult.data[randomIndex]

    // Return the 'text' field from the random negative response
    return {
      statusCode: 200,
      body: JSON.stringify({
        text: negativeResponse.text
      })
    }
  }
}
