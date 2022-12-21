const faunadb = require('faunadb')
const q = faunadb.query
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
})

exports.handler = async (event, context) => {
  try {
    // Fetch all records from the cards collection using the all_cards index
    const response = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index('all_cards'))),
        q.Lambda('X', q.Get(q.Var('X')))
      )
    )

    // Extract the id and name for each record
    const results = response.data.map(record => ({
      id: record.data.id,
      name: record.data.name
    }))

    return {
      statusCode: 200,
      body: JSON.stringify({ results })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
