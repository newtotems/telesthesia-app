const faunadb = require("faunadb");
const q = faunadb.query;

exports.handler = async (event, context) => {
  try {
    const client = new faunadb.Client({
      secret: process.env.DB_SECRT,
    });

    const response = await client.query(
      q.Map(
        q.Paginate(q.Match(q.Index("all_locations"))),
        q.Lambda(
          "locationRef",
          q.Let(
            {
              locationDoc: q.Get(q.Var("locationRef")),
              viewing: q.Select(["data", "viewing"], q.Var("locationDoc"), null)
            },
            q.If(q.IsNull(q.Var("viewing")), null, { viewing: q.Var("viewing") })
          )
        )
      )
    );

    const viewings = response.data.filter((location) => location !== null);

    const count = viewings.length;

    return {
      statusCode: 200,
      body: JSON.stringify({ viewings, count }),
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
