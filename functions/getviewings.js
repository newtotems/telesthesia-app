const faunadb = require("faunadb");
const q = faunadb.query;
const client = new faunadb.Client({ secret: process.env.DB_SECRT });

exports.handler = async (event, context) => {
  try {
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
            q.If(q.IsNull(q.Var("viewing")), null, q.Var("viewing"))
          )
        )
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
};
