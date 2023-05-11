const faunadb = require('faunadb');
const client = new faunadb.Client({ secret: process.env.DB_SECRET });

exports.handler = async (event, context) => {
  try {
    const { clientIp } = context;
    const timestamp = Math.floor(Date.now() / 1000);

    const rateLimitExists = await client.query(
      faunadb.query.Exists(faunadb.query.Match(faunadb.query.Index('rate_limit_by_ip'), clientIp))
    );

    if (!rateLimitExists) {
      await client.query(
        faunadb.query.Create(faunadb.query.Collection('RateLimit'), {
          data: { ip: clientIp, requests: 1, timestamp },
        })
      );
    } else {
      const rateLimit = await client.query(
        faunadb.query.Get(faunadb.query.Match(faunadb.query.Index('rate_limit_by_ip'), clientIp))
      );

      const { requests, timestamp: lastTimestamp } = rateLimit.data;

      if (timestamp - lastTimestamp < 60) {
        if (requests >= 2) {
          return {
            statusCode: 429,
            body: JSON.stringify({ message: 'Rate limit exceeded' }),
          };
        } else {
          await client.query(
            faunadb.query.Update(rateLimit.ref, {
              data: { requests: requests + 1, timestamp },
            })
          );
        }
      } else {
        await client.query(
          faunadb.query.Update(rateLimit.ref, {
            data: { requests: 1, timestamp },
          })
        );
      }
    }

    const headers = event.headers;
    const referer = headers['Referer'] || headers['referer'];
    if (referer !== 'https://telesthesia-app.netlify.app/map/') {
      return {
        statusCode: 403,
        body: 'Forbidden: Invalid Referer URL',
      };
    }

    const body = JSON.parse(event.body);
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    try {
      const result = await client.query(
        faunadb.query.Get(faunadb.query.Match(faunadb.query.Index('locations_lat_and_lon'), [lat, lng]))
      );

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
      const allRecords = await client.query(
        faunadb.query.Paginate(faunadb.query.Match(faunadb.query.Index('all_neg_responses'))),
        faunadb.query.Lambda('record', faunadb.query.Var('record'))
      );

      const numRecords = allRecords.data.length;
      const randomIndex = Math.floor(Math.random() * numRecords);

      return {
        statusCode: 200,
        body: JSON.stringify({
          lat: lat,
          lng: lng,
          text: allRecords.data[randomIndex],
          success: false,
        }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
      }),
    };
  }
};
