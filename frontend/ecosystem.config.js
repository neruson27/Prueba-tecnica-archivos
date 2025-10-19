module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'npx',
      // Opciones para el comando 'serve'
      args: 'serve -s dist -l 3001',
    },
  ],
};