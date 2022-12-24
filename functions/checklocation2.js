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
    // If there is no matching location, query the 'all_neg_responses' index for a random record
    const randomResult = await client.query(
      faunadb.query.Map(
        // Retrieve all records from the 'all_neg_responses' index
        faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('all_neg_responses'))),
        // Select a random record from the retrieved records
        faunadb.query.Lambda(
          'record',
          faunadb.query.If(
            faunadb.query.Equals(
              faunadb.query.Random(),
              faunadb.query.Select(['data', 'id'], faunadb.query.Var('record'))
            ),
            faunadb.query.Select(['data', 'text'], faunadb.query.Var('record')),
            null
          )
        )
      )
    )

    // Return the 'text' field from the random record in the response
    return {
      statusCode: 200,
      body: JSON.stringify({
        text: randomResult.data[0]
      })
    }
  }
}
