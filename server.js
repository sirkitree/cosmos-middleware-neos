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

/***
 * Get latest block height
 *
 * Return response
 **/
app.get('/latest', function(req, res) {
  axios.get(RPC + '/status', { httpsAgent: agent})
        .then(function (response) {
          var latestBlockHeight;
          latestBlockHeight = response.data.result.sync_info.latest_block_height;
          res.send(latestBlockHeight);
        })
})

/***
 * Get average blog time
 *
 * Return response
 **/
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

/***
 * Get active validators
 *
 * Return response
 **/
app.get('/activevalidators', function (req, res) {
  axios.get(RPC + '/validators', {httpsAgent: agent})
        .then(function (response) {
          let validators = response.data.result;
          let validatorsTotalCount = validators.validators.length
          console.log(validatorsTotalCount);
          res.send(validatorsTotalCount.toString());
        })
})

/***
 * Get online voting power
 *
 * Return response
 **/
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

/***
 * Get consensus height
 *
 * Return response
 **/
app.get('/consensus/height', function(req, res) {
  axios.get(RPC + '/dump_consensus_state', {httpsAgent: agent})
        .then(function (response) {
          let height = response.data.result.round_state.height;
          res.send(height.toString());
        })
})

/***
 * Get consensus round
 *
 * Return response
 **/
app.get('/consensus/round', function(req, res) {
  axios.get(RPC + '/dump_consensus_state', {httpsAgent: agent})
        .then(function (response) {
          let round = response.data.result.round_state.round;
          res.send(round.toString());
        })
})

/***
 * Get consensus step
 *
 * Return response
 **/
app.get('/consensus/step', function(req, res) {
  axios.get(RPC + '/dump_consensus_state', {httpsAgent: agent})
        .then(function (response) {
          let step = response.data.result.round_state.step;
          res.send(step.toString());
        })
})

/***
 * Get consensus proposer_address
 *
 * @todo: chain a call to tendermint to retrieve name and logo img
 * 
 * Return response
 **/
app.get('/consensus/proposer_address', function(req, res) {
  axios.get(RPC + '/dump_consensus_state', {httpsAgent: agent})
        .then(function (response) {
          let proposer_address = response.data.result.round_state.validators.proposer.address;
          res.send(proposer_address.toString());
        })
})

/***
 * Get consensus voted_power
 *
 * Return response
 **/
app.get('/consensus/voted_power', function(req, res) {
  axios.get(RPC + '/dump_consensus_state', {httpsAgent: agent})
        .then(function (response) {
          let round = response.data.result.round_state.round;
          let voted_power = Math.round(parseFloat(response.data.result.round_state.votes[round].prevotes_bit_array.split(" ")[3])*100);
          res.send(voted_power.toString());
        })
        //res.send('ok');
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
