const faunadb = require('faunadb')

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
})

exports.handler = async (event, context) => {
  // Parse the request body
  const body = JSON.parse(event.body)
  const lat = Number(body.lat)
  const lng = Number(body.lng)

  // Try to retrieve a matching location from the 'locations_lat_and_lon' index
  try {
    // Retrieve the matching location from the 'locations_lat_and_lon' index
    const result = await client.query(
      faunadb.query.Get(
        faunadb.query.Match(
          faunadb.query.Index('locations_lat_and_lon'),
          faunadb.query.And(
            faunadb.query.Equals(faunadb.query.Var('lat'), lat),
            faunadb.query.Equals(faunadb.query.Var('lng'), lng)
          )
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
    // If there is no matching location, return 'no match' in the 'text' field of the response
    return {
      statusCode: 200,
      body: JSON.stringify({
        text: 'no match'
      })
    }
  }
}
