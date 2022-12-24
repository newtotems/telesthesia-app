const faunadb = require('faunadb')

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
})

exports.handler = async (event, context) => {
  // Parse the request body to get the 'lat' and 'long' parameters
  const body = JSON.parse(event.body)
  const lat = Number(body.lat)
  const long = Number(body.lng)

  // Query the 'locations_by_latlong' index to see if there is a matching record
  const result = await client.query(
    faunadb.query.Get(
      faunadb.query.Match(faunadb.query.Index('locations_by_latlong'), [lat, long])
    )
  )

  // Check if a matching record was found
  if (result.data) {
    // Return the 'image' and 'text' fields from the matching record
    return {
      statusCode: 200,
      body: JSON.stringify({
        image: result.data.image,
        text: result.data.text
      })
    }
  } else {
    // If there is no matching record, get a random negative response from the 'all_negative_responses' collection
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
