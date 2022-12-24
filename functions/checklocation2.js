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

  // Try to retrieve a matching location from the 'all_locations' index
  try {
    // Retrieve the matching location from the 'all_locations' index
    const result = await client.query(
      faunadb.query.Get(
        faunadb.query.Match(
          faunadb.query.Index('all_locations'),
          faunadb.query.Equals(faunadb.query.Var('latlng'), latlng)
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
