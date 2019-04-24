const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

const RPC = 'http://rpc.hub.certus.one:26657';
const SGAPI = 'https://sgapiv2.certus.one/v1';
const KBAPI = 'https://keybase.io/_/api/1.0';

const agent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Root
 * @todo: list endpoints
 */
app.get('/', function (req, res) {
  res.send('This is root');
});

/**
 * Latest block height
 */
app.get('/latest', function (req, res) {
  axios.get(RPC + '/status', { httpsAgent: agent })
    .then(function (response) {
      var latestBlockHeight;
      latestBlockHeight = response.data.result.sync_info.latest_block_height;
      res.send(latestBlockHeight);
    })
});

/**
 * Average block time
 */
app.get('/meantime', function (req, res) {
  axios.get(RPC + '/status', { httpsAgent: agent })
    .then(function (response) {
      var latestBlockHeight;
      var minLastBlocks;
      latestBlockHeight = response.data.result.sync_info.latest_block_height;
      minLastBlocks = latestBlockHeight - 15;
      axios.get(RPC + '/blockchain?minHeight=' + minLastBlocks + '&maxHeight=' + latestBlockHeight, { httpsAgent: agent })
        .then(function (response) {
          var i = 15;
          var times = [];
          var maxTime = 0;
          // something better than while here?
          while (i > 0) {
            var oldest = new Date(response.data.result.block_metas[i].header.time)
            var newer = new Date(response.data.result.block_metas[i - 1].header.time);
            var delta = newer - oldest;
            maxTime = maxTime + delta;
            times.push(delta);
            i--;
          }
          var meanTime = maxTime / 15 / 1000;
          res.send(meanTime.toFixed(2).toString());
        })
    })
});

/**
 * Active validators
 */
app.get('/activevalidators', function (req, res) {
  axios.get(RPC + '/validators', { httpsAgent: agent })
    .then(function (response) {
      let validators = response.data.result;
      let validatorsTotalCount = validators.validators.length;
      res.send(validatorsTotalCount.toString());
    })
});

/**
* Total validators
*
* Uses alternate URL
*/
app.get('/totalvalidators', function (req, res) {
  //axios.get(SGAPI + '/state/validatorNames?fields=operator_address', { httpsAgent: agent })
  axios.get(SGAPI + '/validators/mappings?fields=ACCOUNT_ADDRESS', { httpsAgent: agent })
    .then(function (response) {
      let root = response.data.nameMappings.length;
      res.send(root.toString());
    })
});

/**
 * Online voting power
 */
app.get('/onlinevotingpower', function (req, res) {
  axios.get(RPC + '/validators', { httpsAgent: agent })
    .then(function (response) {
      let validators = response.data.result.validators;
      let activeVP = 0;
      for (v in validators) {
        activeVP += parseInt(validators[v].voting_power);
      }
      res.send(activeVP.toString());
    })
});

/**
 * Consensus height
 */
app.get('/consensus/height', function (req, res) {
  axios.get(RPC + '/dump_consensus_state', { httpsAgent: agent })
    .then(function (response) {
      let height = response.data.result.round_state.height;
      res.send(height.toString());
    })
});

/**
 * Consensus round
 */
app.get('/consensus/round', function (req, res) {
  axios.get(RPC + '/dump_consensus_state', { httpsAgent: agent })
    .then(function (response) {
      let round = response.data.result.round_state.round;
      res.send(round.toString());
    })
});

/**
 * Consensus step
 */
app.get('/consensus/step', function (req, res) {
  axios.get(RPC + '/dump_consensus_state', { httpsAgent: agent })
    .then(function (response) {
      let step = response.data.result.round_state.step;
      res.send(step.toString());
    })
});

/**
 * Consensus proposer address
 */
app.get('/consensus/proposer_address', function (req, res) {
  axios.get(RPC + '/dump_consensus_state', { httpsAgent: agent })
    .then(function (response) {
      let proposer_address = response.data.result.round_state.validators.proposer.address;
      res.send(proposer_address.toString());
    })
});

/**
 * Consensus proposer name
 *
 * Uses alternate url to get propser's english name.
 */
app.get('/consensus/proposer_name', function (req, res) {
  axios.get(RPC + '/dump_consensus_state', { httpsAgent: agent })
    .then(function (response) {
      let proposer_address = response.data.result.round_state.validators.proposer.address;
      axios.get(SGAPI + '/validator/' + proposer_address, { httpsAgent: agent })
        .then(function (response) {
          let proposer_name = response.data.app_data.description.moniker;
          res.send(proposer_name);
        })
    })
});

/**
 * Consensus proposer url
 *
 * Uses alternate url to get proposer's address.
 */
app.get('/consensus/proposer_url', function (req, res) {
  axios.get(RPC + '/dump_consensus_state', { httpsAgent: agent })
    .then(function (response) {
      let proposer_address = response.data.result.round_state.validators.proposer.address;
      axios.get(SGAPI + '/validator/' + proposer_address, { httpsAgent: agent })
        .then(function (response) {
          let proposer_url = response.data.app_data.description.website;
          res.send(proposer_url);
        })
    })
});

/**
 * Consensus proposer avatar
 *
 * Uses alternate url to get proposer's logo image address.
 */
app.get('/consensus/proposer_avatar', function (req, res) {
  axios.get(RPC + '/dump_consensus_state', { httpsAgent: agent })
    .then(function (response) {
      let proposer_address = response.data.result.round_state.validators.proposer.address;
      axios.get(SGAPI + '/validator/' + proposer_address, { httpsAgent: agent })
        .then(function (response) {
          let key = response.data.app_data.description.identity;
          axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + key, { httpsAgent: agent })
            .then(function (key_response) {
              res.send(key_response.data.them[0].pictures.primary.url);
            })
        })
    })
});

/**
 * Consensus vote power
 */
app.get('/consensus/voted_power', function (req, res) {
  axios.get(RPC + '/dump_consensus_state', { httpsAgent: agent })
    .then(function (response) {
      let round = response.data.result.round_state.round;
      let voted_power = Math.round(parseFloat(response.data.result.round_state.votes[round].prevotes_bit_array.split(" ")[3]) * 100);
      res.send(voted_power.toString());
    })
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
