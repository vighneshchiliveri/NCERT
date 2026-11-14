/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/*": ["./templates/study.html"]
  }
};

export default nextConfig;
