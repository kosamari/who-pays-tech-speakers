var bunyan = require('bunyan');
module.exports = bunyan.createLogger({
                  name: 'whopaysspeakers',
                  streams: [
                      {
                          level: 'info',
                          path: './whopaysspeakers.log'
                      }
                  ]
                 });