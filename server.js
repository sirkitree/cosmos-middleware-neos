const axios = require('axios');
const https = require('https');
var express = require('express')
var app = express()
const port = 8080;

const RPC = 'http://rpc.hub.certus.one:26657';

const agent = new https.Agent({
  rejectUnauthorized: false
});


app.get('/', function(req, res) {
  res.send('This is root');
})

app.get('/latest', function(req, res) {
  axios.get(RPC + '/status', { httpsAgent: agent})
        .then(function (response) {
          var latestBlockHeight;
          latestBlockHeight = response.data.result.sync_info.latest_block_height;
          res.send(latestBlockHeight);
        })
})

app.get('/meantime', function(req, res) {
  axios.get(RPC + '/status', { httpsAgent: agent})
        .then(function (response) {
          var latestBlockHeight;
          var minLastBlocks;
          latestBlockHeight = response.data.result.sync_info.latest_block_height;
          minLastBlocks = latestBlockHeight - 15;
          axios.get(RPC + '/blockchain?minHeight=' + minLastBlocks + '&maxHeight=' + latestBlockHeight, {httpsAgent: agent})
                .then(function (response) {
                  var i = 15;
                  var times = [];
                  var maxTime = 0;
                  while (i > 0)
                  {
                    var oldest = new Date(response.data.result.block_metas[i].header.time)
                    var newer = new Date(response.data.result.block_metas[i - 1].header.time);
                    var delta = newer - oldest;
                    maxTime = maxTime + delta;
                    times.push(delta);
                    i--;
                  }
                  var meanTime = maxTime / 15 / 1000;
                  console.log(meanTime);
                  res.send(meanTime.toFixed(2).toString());
                })
        })
})

app.get('/activevalidators', function (req, res) {
  axios.get(RPC + '/validators', {httpsAgent: agent})
        .then(function (response) {
          let validators = response.data.result;
          let validatorsTotalCount = validators.validators.length
          console.log(validatorsTotalCount);
          res.send(validatorsTotalCount.toString());
        })
})
app.get('/onlinevotingpower', function (req, res) {
  axios.get(RPC + '/validators', {httpsAgent: agent})
        .then(function (response) {
          let validators = response.data.result.validators;
          let activeVP = 0;
          for (v in validators){
            activeVP += parseInt(validators[v].voting_power);
          }
          res.send(activeVP.toString())
        })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
