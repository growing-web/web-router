export async function publicMeta() {
  return {
    title: String
  };
}

export async function serverRender() {
  return {
    content: String,
    assets: String
  };
}
export async function responseHeaders() {
  return {};
}
