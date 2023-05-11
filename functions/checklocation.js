const faunadb = require('faunadb');

// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
});

exports.handler = async (event, context) => {

  // IP Rate Limiting
  try {
    const { clientIp } = context;
    const timestamp = Math.floor(Date.now() / 1000);

    // Check if the IP address exists in the RateLimit collection
    const rateLimitExists = await client.query(
      faunadb.query.Exists(faunadb.query.Match(faunadb.query.Index('rate_limit_by_ip'), clientIp))
    );

    if (!rateLimitExists) {
      // IP address is not in the RateLimit collection, create a new entry
      await client.query(
        faunadb.query.Create(faunadb.query.Collection('RateLimit'), {
          data: {
            ip: clientIp,
            requests: 1,
            timestamp,
          },
        })
      );
    } else {
      // IP address already exists, update the requests count
      const rateLimit = await client.query(
        faunadb.query.Get(faunadb.query.Match(faunadb.query.Index('rate_limit_by_ip'), clientIp))
      );

      const { requests, timestamp: lastTimestamp } = rateLimit.data;

      // Check if the last request was made within the last minute
      if (timestamp - lastTimestamp < 60) {
        if (requests >= 2) {
          // User has exceeded the rate limit
          return {
            statusCode: 429,
            body: JSON.stringify({
              message: 'Rate limit exceeded',
            }),
          };
        } else {
          // Increment the request count
          await client.query(
            faunadb.query.Update(rateLimit.ref, {
              data: {
                requests: requests + 1,
                timestamp,
              },
            })
          );
        }
      } else {
        // Reset the request count for a new minute
        await client.query(
          faunadb.query.Update(rateLimit.ref, {
            data: {
              requests: 1,
              timestamp,
            },
          })
        );
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }

  // Check the HTTP Referer header
  const headers = event.headers;
  const referer = headers['Referer'] || headers['referer'];
  if (referer !== 'https://telesthesia-app.netlify.app/map/') {
    return {
      statusCode: 403,
      body: 'Forbidden: Invalid Referer URL',
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
        faunadb.query.Match(faunadb.query.Index('locations_lat_and_lon'), [lat, lng])
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
        success: true,
      }),
    };
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
    };
  }
};

