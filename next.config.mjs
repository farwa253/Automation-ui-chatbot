/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */

  // Next.js 15.3+/16 blocks cross-origin requests to the dev server's
  // internal assets by default. If you open the app from a different
  // hostname than the one `next dev` is bound to (a VS Code forwarded
  // port, a Codespace/devcontainer URL, a LAN IP, 127.0.0.1 vs
  // localhost, etc.), Chrome will show a "Blocked cross-origin request"
  // error and the page will fail to hydrate — which also breaks every
  // button, since none of the client-side JS ran.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
