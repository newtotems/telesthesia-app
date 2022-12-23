const faunadb = require('faunadb');

exports.handler = async (event, context) => {
  // Parse the lat and long values from the request body
  const body = JSON.parse(event.body);
  const lat = body.lat;
  const lng = body.lng;

  // Create a FaunaDB client
  const client = new faunadb.Client({ secret: process.env.DB_SECRT });

  // Try to find a matching record in the locations_by_latlong index
  try {
    const result = await client.query(
      faunadb.query.Get(
        faunadb.query.Match(faunadb.query.Index('locations_by_latlong'), [lat, lng])
      )
    );

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
    // Try to get a random record from the all_negative_responses index
    try {
        const result = await client.query(
          faunadb.query.Count(faunadb.query.Index('all_negative_responses'))
        );
  
        // Generate a random number up to the maximum value of the number of records
        const maxRecordId = result.data.count;
        const randomRecordId = Math.floor(Math.random() * maxRecordId);
  
        // Fetch the record with the generated ID from the all_negative_responses index
        const record = await client.query(
          faunadb.query.Get(faunadb.query.Ref(faunadb.query.Match(faunadb.query.Index('all_negative_responses_by_id'), randomRecordId)))
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
      // Return an error if unable to get a random record from the all_negative_responses index
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: 'Error: Unable to get a random record from the all_negative_responses index'
      };
    }
  }
};
