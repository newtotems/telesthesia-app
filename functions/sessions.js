const faunadb = require('faunadb');
const q = faunadb.query;
const client = new faunadb.Client({ secret: process.env.DB_SECRET });

// Function to generate a random session ID
function generateSessionId() {
  // Generate a random string using alphanumeric characters
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 16;
  let sessionId = '';
  for (let i = 0; i < length; i++) {
    sessionId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return sessionId;
}

// Function to create a new session in FaunaDB
async function createSession() {
  const sessionId = generateSessionId();
  await client.query(
    q.Create(q.Collection('sessions'), {
      data: {
        sessionId: sessionId,
        requestCount: 0,
        timestamp: new Date().getTime(),
      },
    })
  );
  return sessionId;
}

exports.handler = async (event, context) => {
  // Retrieve the session ID from the request headers
  const sessionId = event.headers['X-Session-ID'];

  // Retrieve the session data from FaunaDB based on the session ID
  const { data } = await client.query(
    q.Get(q.Match(q.Index('sessions_by_sessionId'), sessionId))
  );

  // Get current timestamp
  const currentTimestamp = new Date().getTime();

  if (!data) {
    // Create a new session if it doesn't exist
    const newSessionId = await createSession();
    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: newSessionId, message: 'New session created.' }),
    };
  }

  // Check if rate limit exceeded
  if (currentTimestamp - data.timestamp < 60000 && data.requestCount >= 2) {
    return {
      statusCode: 429,
      body: JSON.stringify({ message: 'Rate limit exceeded.' }),
    };
  }

  // Reset request count if one minute has passed
  if (currentTimestamp - data.timestamp >= 60000) {
    await client.query(
      q.Update(data.ref, {
        data: {
          requestCount: 0,
          timestamp: currentTimestamp,
        },
      })
    );
  }

  // Increment request count
  await client.query(
    q.Update(data.ref, {
      data: {
        requestCount: data.requestCount + 1,
        timestamp: currentTimestamp,
      },
    })
  );

  // Proceed with the request
  return {
    statusCode: 200,
    body: JSON.stringify({ sessionId: sessionId, message: 'Session exists.' }),
  };
};
