export async function response() {
  return new Response(JSON.stringify({
    "hello": "world"
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment;filename=res.json'
    }
  });
}