const faunadb = require('faunadb')

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
})

exports.handler = async (event, context) => {
  // Get all documents in the 'locations' collection
  const result = await client.query(
    faunadb.query.Map(
      // Get all documents in the 'locations' collection
      faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('locations_by_latlong'))),
      // Retrieve the document data for each location
      faunadb.query.Lambda((ref) => faunadb.query.Get(ref))
    )
  )

  // Return the data for each location in the response
  const locations = result.data.map((location) => location.data)
  return {
    statusCode: 200,
    body: JSON.stringify({
      locations: locations
    })
  }
}
