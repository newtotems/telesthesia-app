const faunadb = require('faunadb');
const client = new faunadb.Client({
  secret: process.env.DB_SECRT
});

exports.handler = async (event, context) => {
  const headers = event.headers;
  const referer = headers['Referer'] || headers['referer'];
  if (referer !== 'https://telesthesia-app.netlify.app/map/') {
    return {
      statusCode: 403,
      body: 'Forbidden: Invalid Referer URL'
    };
  }

  const ipAddress = headers['x-forwarded-for'] || headers['x-nf-client-connection-ip'] || '';
  console.log(ipAddress);

  if (!ipAddress) {
    return {
      statusCode: 400,
      body: 'Bad Request: Unable to determine IP address'
    };
  }

  const currentTime = Math.floor(Date.now() / 1000);

  try {
    const { data: rateLimitData } = await client.query(
      faunadb.query.Let(
        {
          rateLimitRef: faunadb.query.Match(
            faunadb.query.Index('rate_limit_by_ip'),
            ipAddress
          )
        },
        faunadb.query.If(
          faunadb.query.Exists(faunadb.query.Var('rateLimitRef')),
          faunadb.query.Get(faunadb.query.Var('rateLimitRef')),
          null
        )
      )
    );
  
    let lastRequestTime = 0;
    let requestCount = 0;
  
    if (rateLimitData) {
      lastRequestTime = rateLimitData.data.lastRequestTime || 0;
      requestCount = rateLimitData.data.requestCount || 0;
    }
  
    console.log('Rate Limit Entry:', rateLimitData);
  
    const timeSinceLastRequest = currentTime - lastRequestTime;
    if (timeSinceLastRequest < 60 && requestCount >= 2) {
      return {
        statusCode: 429,
        body: 'Too Many Requests: Rate limit exceeded'
      };
    }
  
    console.log('Creating/Updating Rate Limit Entry...');
  
    await client.query(
      faunadb.query.If(
        faunadb.query.IsNull(rateLimitData),
        faunadb.query.Create(faunadb.query.Collection('RateLimit'), {
          data: {
            ipAddress: ipAddress,
            lastRequestTime: currentTime,
            requestCount: 1
          }
        }),
        faunadb.query.Update(faunadb.query.Select(['ref'], rateLimitData), {
          data: {
            lastRequestTime: currentTime,
            requestCount: faunadb.query.If(
              faunadb.query.LTE(timeSinceLastRequest, 60),
              faunadb.query.Add(requestCount, 1),
              requestCount
            )
          }
        })
      )
    );
  
    console.log('Rate Limit Entry created/updated successfully.');
 
     
    const body = JSON.parse(event.body);
    const lat = Number(body.lat);
    const lng = Number(body.lng);

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
    const body = JSON.parse(event.body);
    const lat = Number(body.lat);
    const lng = Number(body.lng);

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
