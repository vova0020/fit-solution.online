module.exports = {
  apps: [{
    name: 'test',
    script: 'server.js',
    env: {
      PORT: 3005,
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};