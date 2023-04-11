const faunadb = require("faunadb");
const q = faunadb.query;

exports.handler = async (event, context) => {
  try {
    const client = new faunadb.Client({
      secret: process.env.DB_SECRET,
    });
    
    const response = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index("all_locations"))),
        q.Lambda(
          "locationRef",
          q.Get(q.Var("locationRef"))
        )
      )
    );

    const viewings = response.data.map((location) => ({
      viewing: location.data.viewing,
    }));

    const count = response.data.length;

    return {
      statusCode: 200,
      body: JSON.stringify({ viewings, count }),
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
