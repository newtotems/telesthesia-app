const faunadb = require('faunadb');
const Bottleneck = require('bottleneck');

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
});

// Create a new limiter with 3 tokens and a 60 second window
const limiter = new Bottleneck({
  reservoir: 3,
  reservoirRefreshInterval: 60 * 1000
});

exports.handler = limiter.wrap(async (event, context) => {

  // Check the HTTP Referer header
  const headers = event.headers;
  const referer = headers['Referer'] || headers['referer'];
  if (referer !== 'https://telesthesia-app.netlify.app/telesthesia/') {
    return {
      statusCode: 403,
      body: 'Forbidden: Invalid Referer URL'
    };
  }

  // Parse the request body
  const body = JSON.parse(event.body);
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  // Try to retrieve a matching location from the 'locations_lat_and_lon' index
  try {
    // Retrieve the matching location from the 'locations_lat_and_lon' index
    const result = await client.query(
      faunadb.query.Get(
        faunadb.query.Match(
          faunadb.query.Index('locations_lat_and_lon'),
          [lat, lng]
        )
      )
    );

    // Return the 'image' and 'text' fields from the matching location in the response
    return {
      statusCode: 200,
      body: JSON.stringify({
        lat: lat,
        lng: lng,
        image: result.data.image,
        text: result.data.text,
        success: true
      })
    }
  } catch (error) {
    // If there is no matching location, read all records in the 'all_neg_responses' collection
    const allRecords = await client.query(
      faunadb.query.Map(
        faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('all_neg_responses'))),
        faunadb.query.Lambda(
          'record',
          faunadb.query.Var('record')
        )
      )
    );

    // Get the number of records in the 'all_neg_responses' collection
    const numRecords = allRecords.data.length;

    // Choose a random index between 0 and numRecords - 1
    const randomIndex = Math.floor(Math.random() * numRecords);

    // Return the record at the random index in the 'all_neg_responses' collection in the response
    return {
      statusCode: 200,
      body: JSON.stringify({
        lat: lat,
        lng: lng,
        text: allRecords.data[randomIndex],
        success: false
      })
    }
  }
});
