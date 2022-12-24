const faunadb = require('faunadb')

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
})

exports.handler = async (event, context) => {
  // Parse the request body to get the 'lat' and 'long' parameters
  const body = JSON.parse(event.body)
  const lat = body.lat
  const long = body.lng

  // Query the 'locations_by_latlong' index to retrieve all matching records
  const result = await client.query(
    faunadb.query.Map(
      // Get all documents from the 'locations_by_latlong' index that match the 'lat' and 'long' values
      faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('locations_by_latlong'), [lat, long])),
      // Retrieve the document data for each matching record
      faunadb.query.Lambda((ref) => faunadb.query.Get(ref))
    )
  )

  // Check if any matching records were found
  if (result.data.length > 0) {
    // Select a random matching record from the list
    const randomIndex = Math.floor(Math.random() * result.data.length)
    const matchingRecord = result.data[randomIndex]

    // Return the 'image' and 'text' fields from the random matching record
    return {
      statusCode: 200,
      body: JSON.stringify({
        image: matchingRecord.image,
        text: matchingRecord.text
      })
    }
  } else {
    // If there are no matching records, get a random negative response from the 'all_negative_responses' collection
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
