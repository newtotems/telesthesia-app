const faunadb = require('faunadb');
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
});

exports.handler = async (event, context) => {
  const headers = event.headers;
  const ipAddress = headers['x-forwarded-for'] || headers['x-nf-client-connection-ip'] || '';
  const referer = headers['Referer'] || headers['referer'];

  if (referer !== 'https://telesthesia-app.netlify.app/map/') {
    return {
      statusCode: 403,
      body: 'Forbidden: Invalid Referer URL'
    };
  }

  try {
    // Check if the IP has exceeded the rate limit
    const rateLimitResponse = await client.query(
      faunadb.query.Get(
        faunadb.query.Match(
          faunadb.query.Index('rate_limit_by_ip'),
          ipAddress
        )
      )
    );

    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
    const rateLimitData = rateLimitResponse.data;
    const requestsPerSecond = 2; // Maximum number of requests allowed per second

    if (rateLimitData.timestamp >= currentTime - requestsPerSecond) {
      // IP has exceeded the rate limit
      return {
        statusCode: 429,
        body: 'Too Many Requests'
      };
    } else {
      // IP is within the rate limit, update the timestamp
      await client.query(
        faunadb.query.Update(rateLimitData.ref, {
          data: {
            timestamp: currentTime
          }
        })
      );
    }
  } catch (error) {
    // Rate limit data not found, create a new record
    await client.query(
      faunadb.query.Create(
        faunadb.query.Collection('RateLimit'),
        {
          data: {
            ip: ipAddress,
            timestamp: Math.floor(Date.now() / 1000) // Convert to seconds
          }
        }
      )
    );
  }

  const body = JSON.parse(event.body);
  const lat = Number(body.lat);
  const lng = Number(body.lng);

  try {
    const result = await client.query(
      faunadb.query.Get(
        faunadb.query.Match(
          faunadb.query.Index('locations_lat_and_lon'),
          [lat, lng]
        )
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        lat: lat,
        lng: lng,
        image: result.data.image,
        text: result.data.text,
        success: true
      })
    };
  } catch (error) {
    // If there is no matching location, read all records in the 'all_neg_responses' collection
    const allRecords = await client.query(
      faunadb.query.Map(
        faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('all_neg_responses'))),
        faunadb.query.Lambda('record', faunadb.query.Var('record'))
      )
    );

    const numRecords = allRecords.data.length;
    const randomIndex = Math.floor(Math.random() * numRecords);

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
