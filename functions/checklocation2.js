const faunadb = require('faunadb')

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
})

exports.handler = async (event, context) => {
  // Query the 'all_negative_responses' collection to retrieve all negative responses
  const result = await client.query(
    faunadb.query.Map(
      // Get all documents from the 'all_negative_responses' collection
      faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('all_negative_responses'))),
      // Retrieve the document data for each negative response
      faunadb.query.Lambda((ref) => faunadb.query.Get(ref))
    )
  )

  // Select a random negative response from the list of all negative responses
  const randomIndex = Math.floor(Math.random() * result.data.length)
  const negativeResponse = result.data[randomIndex]

  // Return the selected negative response
  return {
    statusCode: 200,
    body: JSON.stringify(negativeResponse)
  }
}
