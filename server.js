const axios = require('axios');
const https = require('https');
const RPC = 'http://rpc.hub.certus.one:26657';

const agent = new https.Agent({  
  rejectUnauthorized: false
});
axios.get(RPC + '/status', { httpsAgent: agent})
  .then(function (response) {
    var latestBlockHeight = response.data.result.sync_info.latest_block_height;
    console.log('data =>', latestBlockHeight);
  })
  .then(function (error) {
    if (error) {
      console.log('error =>', error);
    }
  })