const faunadb = require('faunadb')

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
})

exports.handler = async (event, context) => {
  // Parse the request body
  const body = JSON.parse(event.body)
  const lat = Number(body.lat)
  const latstring = lat.toString()
  const lng = Number(body.lng)
  const lngstring = lng.toString()

  const latlng = latstring + lngstring
  console.log(latlng)
  console.log(typeof latlng)

  // Try to retrieve a matching location from the 'all_locations' index
  try {
    // Retrieve the matching location from the 'all_locations' index
    const result = await client.query(
      faunadb.query.Get(
        faunadb.query.Match(
          faunadb.query.Index('locations_latlong'),latlng
        )
      )
    )

    // Return the 'image' and 'text' fields from the matching location in the response
    return {
      statusCode: 200,
      body: JSON.stringify({
        image: result.data.image,
        text: result.data.text
      })
    }
  } catch (error) {
    // If there is no matching location, read all records in the 'all_neg_responses' collection
    const allRecords = await client.query(
      faunadb.query.Map(
        faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('all_neg_responses')))
      )
    )

    // Get the number of records in the 'all_neg_responses' collection
    const numRecords = allRecords.data.length
    // Choose a random number between 0 and the number of records
    const randomIndex = Math.floor(Math.random() * numRecords)
    // Select the corresponding record in 'all_neg_responses'
    const randomRecord = allRecords.data[randomIndex]

    // Return the selected record in the response as the 'text' field
    return {
      statusCode: 200,
      body: JSON.stringify({
        text: randomRecord
      })
    }
  }
}
