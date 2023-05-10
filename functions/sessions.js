const faunadb = require('faunadb');
const q = faunadb.query;
// Create a new FaunaDB client
const client = new faunadb.Client({
  secret: process.env.DB_SECRT,
});

// Function to check if an IP address has exceeded the rate limit
async function isRateLimitExceeded(ipAddress) {
  try {
    const { data } = await client.query(
      q.Get(q.Match(q.Index('rate_limit_by_ipAddress'), ipAddress))
    );
    const currentTimestamp = new Date().getTime();
    const timeDifference = currentTimestamp - data.timestamp;
    
    // Check if rate limit exceeded
    if (timeDifference < 60000 && data.requestCount >= 2) {
      return true;
    }

    // Reset request count if one minute has passed
    if (timeDifference >= 60000) {
      await client.query(
        q.Update(data.ref, {
          data: {
            requestCount: 0,
            timestamp: currentTimestamp,
          },
        })
      );
    }

    return false;
  } catch (error) {
    if (error.name === 'NotFound') {
      // Create a new rate limit entry for the IP address
      await client.query(
        q.Create(q.Collection('rate_limits'), {
          data: {
            ipAddress: ipAddress,
            requestCount: 0,
            timestamp: new Date().getTime(),
          },
        })
      );
      return false;
    }

    // Handle other errors
    throw error;
  }
}

// Function to increment the request count for an IP address
async function incrementRequestCount(ipAddress) {
  await client.query(
    q.Update(q.Select('ref', q.Get(q.Match(q.Index('rate_limit_by_ipAddress'), ipAddress))), {
      data: {
        requestCount: q.Add(
          q.Select(['data', 'requestCount'], q.Get(q.Match(q.Index('rate_limit_by_ipAddress'), ipAddress))),
          1
        ),
        timestamp: new Date().getTime(),
      },
    })
  );
}

exports.handler = async (event, context) => {
  // Retrieve the IP address from the request headers
  const ipAddress = event.headers['X-Forwarded-For'] || event.headers['X-Real-IP'];

  try {
    // Check if rate limit exceeded
    if (await isRateLimitExceeded(ipAddress)) {
      return {
        statusCode: 429,
        body: JSON.stringify({ message: 'Rate limit exceeded.' }),
      };
    }

    // Increment request count
    await incrementRequestCount(ipAddress);

    // Proceed with the request
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Request processed.' }),
    };
  } catch (error) {
    // Handle errors
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error.' }),
    };
  }
};
