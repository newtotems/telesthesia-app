const faunadb = require('faunadb')

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
})

exports.handler = async (event, context) => {
  // Get all collections in the database
  const result = await client.query(
    faunadb.query.Map(
      // Get all collections
      faunadb.query.Paginate(faunadb.query.Collections()),
      // Retrieve the name of each collection
      faunadb.query.Lambda((ref) => faunadb.query.Get(ref))
    )
  )

  // Return the names of the collections in the response
  const collectionNames = result.data.map((collection) => collection.name)
  return {
    statusCode: 200,
    body: JSON.stringify({
      collections: collectionNames
    })
  }
}
