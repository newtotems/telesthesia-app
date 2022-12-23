const faunadb = require('faunadb');

exports.handler = async (event, context) => {
  // Parse the lat and long values from the request body
  const body = JSON.parse(event.body);
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  console.log(lat,lng);

  // Create a FaunaDB client
  const client = new faunadb.Client({ secret: process.env.DB_SECRT });

  // Try to find a matching record in the locations_by_latlong index
  try {
    const result = await client.query(
      faunadb.query.Get(
        faunadb.query.Match(faunadb.query.Index('locations_by_latlong'), [lat, lng])
      )
    );

    var jr = JSON.stringify(result);
    console.log(jr);

    // Return the image and text fields from the matching record
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        image: result.data.image,
        text: result.data.text
      })
    };
  } catch (error) {
    // Fetch the record with the ID of 1 from the all_negative_responses index
    try {
      const record = await client.query(
        faunadb.query.Match(faunadb.query.Index('all_negative_responses_by_id'), 1)
      );

      // Return the text field from the fetched record
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          text: record.data.text
        })
      };
    } catch (error) {
      // Return a message if an error occurred
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: 'ERROR unknwn'
      };
    }
  }
};
