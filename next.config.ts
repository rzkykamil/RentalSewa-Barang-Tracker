import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for the Docker `app` image (docs/technical-spec.md §11)
  // — bundles only the traced production dependencies instead of copying
  // the full node_modules tree into the runtime image.
  output: "standalone",
};

export default nextConfig;
