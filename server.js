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
 * helper function for Random
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

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
          let proposer_name = response.data.validator.details.description.moniker;
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
          let proposer_url = response.data.validator.details.description.website;
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
          let key = response.data.validator.details.description.identity;
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

/**
* Random validators
*
* Uses alternate URL
*/

app.get('/validators/random', function (req, res) {
  axios.get(SGAPI + '/validators/mappings?fields=CONS_ADDRESS', { httpsAgent: agent })
    .then(function (response) {
      var mappings;
      var output = new Array();
      var randoms = new Array();
      var images = new Array();
      mappings = response.data.nameMappings;
      for (let i = 0; i < 10; i++) {
        let number = getRandomInt(mappings.length);
        randoms.push(mappings[number].consensusAddress);
        mappings.splice(number, 1);
      }
      axios.all([
        axios.get(SGAPI + '/validator/' + randoms[0], { httpsAgent: agent }),
        axios.get(SGAPI + '/validator/' + randoms[1], { httpsAgent: agent }),
        axios.get(SGAPI + '/validator/' + randoms[2], { httpsAgent: agent }),
        axios.get(SGAPI + '/validator/' + randoms[3], { httpsAgent: agent }),
        axios.get(SGAPI + '/validator/' + randoms[4], { httpsAgent: agent }),
        axios.get(SGAPI + '/validator/' + randoms[5], { httpsAgent: agent }),
        axios.get(SGAPI + '/validator/' + randoms[6], { httpsAgent: agent }),
        axios.get(SGAPI + '/validator/' + randoms[7], { httpsAgent: agent }),
        axios.get(SGAPI + '/validator/' + randoms[8], { httpsAgent: agent }),
        axios.get(SGAPI + '/validator/' + randoms[9], { httpsAgent: agent }),
      ])
        .then(axios.spread(function (data1, data2, data3, data4, data5, data6, data7, data8, data9, data10) {
          let proposer_name = data1.data.validator.details.description.moniker;
          let tokens = data1.data.validator.details.tokens;
          let power = tokens.slice(0, -6);
          let uptime = data1.data.validator.uptime.period;
          output.push([{ name: proposer_name, power: power, uptime: uptime }]);
          let key = data1.data.validator.details.description.identity;
          images.push(key);

          proposer_name = data2.data.validator.details.description.moniker;
          tokens = data2.data.validator.details.tokens;
          power = tokens.slice(0, -6);
          uptime = data2.data.validator.uptime.period;
          output.push([{ name: proposer_name, power: power, uptime: uptime }]);
          key = data2.data.validator.details.description.identity;
          images.push(key);

          proposer_name = data3.data.validator.details.description.moniker;
          tokens = data3.data.validator.details.tokens;
          power = tokens.slice(0, -6);
          uptime = data3.data.validator.uptime.period;
          output.push([{ name: proposer_name, power: power, uptime: uptime }]);
          key = data3.data.validator.details.description.identity;
          images.push(key);

          proposer_name = data4.data.validator.details.description.moniker;
          tokens = data4.data.validator.details.tokens;
          power = tokens.slice(0, -6);
          uptime = data4.data.validator.uptime.period;
          output.push([{ name: proposer_name, power: power, uptime: uptime }]);
          key = data4.data.validator.details.description.identity;
          images.push(key);

          proposer_name = data5.data.validator.details.description.moniker;
          tokens = data5.data.validator.details.tokens;
          power = tokens.slice(0, -6);
          uptime = data5.data.validator.uptime.period;
          output.push([{ name: proposer_name, power: power, uptime: uptime }]);
          key = data5.data.validator.details.description.identity;
          images.push(key);

          proposer_name = data6.data.validator.details.description.moniker;
          tokens = data6.data.validator.details.tokens;
          power = tokens.slice(0, -6);
          uptime = data6.data.validator.uptime.period;
          output.push([{ name: proposer_name, power: power, uptime: uptime }]);
          key = data6.data.validator.details.description.identity;
          images.push(key);

          proposer_name = data7.data.validator.details.description.moniker;
          tokens = data7.data.validator.details.tokens;
          power = tokens.slice(0, -6);
          uptime = data7.data.validator.uptime.period;
          output.push([{ name: proposer_name, power: power, uptime: uptime }]);
          key = data7.data.validator.details.description.identity;
          images.push(key);

          proposer_name = data8.data.validator.details.description.moniker;
          tokens = data8.data.validator.details.tokens;
          power = tokens.slice(0, -6);
          uptime = data8.data.validator.uptime.period;
          output.push([{ name: proposer_name, power: power, uptime: uptime }]);
          key = data8.data.validator.details.description.identity;
          images.push(key);

          proposer_name = data9.data.validator.details.description.moniker;
          tokens = data9.data.validator.details.tokens;
          power = tokens.slice(0, -6);
          uptime = data9.data.validator.uptime.period;
          output.push([{ name: proposer_name, power: power, uptime: uptime }]);
          key = data9.data.validator.details.description.identity;
          images.push(key);

          proposer_name = data10.data.validator.details.description.moniker;
          tokens = data10.data.validator.details.tokens;
          power = tokens.slice(0, -6);
          uptime = data10.data.validator.uptime.period;
          output.push([{ name: proposer_name, power: power, uptime: uptime }]);
          key = data10.data.validator.details.description.identity;
          images.push(key);

          axios.all([
            axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + images[0], { httpsAgent: agent }),
            axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + images[1], { httpsAgent: agent }),
            axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + images[2], { httpsAgent: agent }),
            axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + images[3], { httpsAgent: agent }),
            axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + images[4], { httpsAgent: agent }),
            axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + images[5], { httpsAgent: agent }),
            axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + images[6], { httpsAgent: agent }),
            axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + images[7], { httpsAgent: agent }),
            axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + images[8], { httpsAgent: agent }),
            axios.get(KBAPI + '/user/lookup.json?fields=pictures&key_suffix=' + images[9], { httpsAgent: agent }),
          ])
            .then(axios.spread(function (data1, data2, data3, data4, data5, data6, data7, data8, data9, data10) {
              if (data1.data.them) {
                console.log(data1.data.them[0].pictures.primary.url);
              }
              let avatar;

              if (data1.data.them) {
                avatar = data1.data.them[0].pictures.primary.url;
              } else {
                avatar = 'none';
              }
              output[0].push({ image: avatar });

              if (data2.data.them) {
                avatar = data2.data.them[0].pictures.primary.url;
              } else {
                avatar = 'none';
              }
              output[1].push({ image: avatar });

              if (data3.data.them) {
                avatar = data3.data.them[0].pictures.primary.url;
              } else {
                avatar = 'none';
              }
              output[2].push({ image: avatar });

              if (data4.data.them) {
                avatar = data4.data.them[0].pictures.primary.url;
              } else {
                avatar = 'none';
              }
              output[3].push({ image: avatar });

              if (data5.data.them) {
                avatar = data5.data.them[0].pictures.primary.url;
              } else {
                avatar = 'none';
              }
              output[4].push({ image: avatar });

              if (data6.data.them) {
                avatar = data6.data.them[0].pictures.primary.url;
              } else {
                avatar = 'none';
              }
              output[5].push({ image: avatar });

              if (data7.data.them) {
                avatar = data7.data.them[0].pictures.primary.url;
              } else {
                avatar = 'none';
              }
              output[6].push({ image: avatar });

              if (data8.data.them) {
                avatar = data8.data.them[0].pictures.primary.url;
              } else {
                avatar = 'none';
              }
              output[7].push({ image: avatar });

              if (data9.data.them) {
                avatar = data9.data.them[0].pictures.primary.url;
              } else {
                avatar = 'none';
              }
              output[8].push({ image: avatar });

              if (data10.data.them) {
                avatar = data10.data.them[0].pictures.primary.url;
              } else {
                avatar = 'none';
              }
              output[9].push({ image: avatar });

              //var output_str = '';
              //for (let i = 0; i < output.length; i++) {
              //  output_str += output[i][0].name + ',' + output[i][1].image + ',' + output[i][0].power + ',' + output[i][0].uptime
              //  if (i < 9) {
              //    output_str += ',';
              //  }
              //}
              var output_json = {
                "validators": []
              };
              for (let i=0; i < output.length; i++)
              {
                let validator = {
                  "name": output[i][0].name,
                  "image": output[i][1].image,
                  "power": output[i][0].power,
                  "uptime": output[i][0].uptime
                }
                output_json['validators'].push(validator);
              }
              console.log(output_json);
              res.send('123')
              //res.send(output_str);
            }));
        }));
    });
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
