export async function onRequest(context) {
  try {

    const request = context.request;

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json();
    const { model, messages } = body;

    if (!model || !messages || !Array.isArray(messages)) {
      return new Response('Invalid request body', { status: 400 });
    }

    const response = await context.env.AI.run(model, { messages, temperature: 0.1 });

    return new Response(JSON.stringify({
      response: response.response,
      tokens: response.tokens || 0
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in evaluate function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
