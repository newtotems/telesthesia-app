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

  // Try to retrieve a matching location from the 'all_locations' index
  try {
    client.query(
      faunadb.query.Map(
        faunadb.query.Paginate(
          faunadb.query.Match(
            faunadb.query.Index('all_locations')
          )
        ),
        faunadb.lambda((x) => faunadb.query.Get(x))
      )
    ).then((result) => {
      // Print the documents in the 'all_locations' index to the console
      console.log(result.data)
    }).catch((error) => {
      console.error(error)
    })
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
