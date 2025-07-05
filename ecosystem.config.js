module.exports = {
  apps: [
    {
      name: 'bodo-app',
      script: 'npm',
      args: 'start',
      cwd: '$HOME/bodo',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/bodo/err.log',
      out_file: '/var/log/bodo/out.log',
      log_file: '/var/log/bodo/combined.log',
      time: true
    }
  ]
}; 