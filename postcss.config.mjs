/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // Este es el nuevo nombre que pide el error
  },
};

export default config;