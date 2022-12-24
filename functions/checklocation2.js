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
      faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('all_neg_responses'))),
      faunadb.query.Lambda(
        'record',
        faunadb.query.Var('record')
      )
    )
  )

  // Get the number of records in the 'all_neg_responses' collection
  const numRecords = allRecords.data.length

  // Choose a random index between 0 and numRecords - 1
  const randomIndex = Math.floor(Math.random() * numRecords)

  // Return the record at the random index in the 'all_neg_responses' collection in the response
  return {
    statusCode: 200,
    body: JSON.stringify({
      text: allRecords.data[randomIndex]
    })
  }
  }
}
