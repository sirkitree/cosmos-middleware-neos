const axios = require('axios');
const https = require('https');
const cheerio = require('cheerio');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

const RPC = 'http://rpc.hub.certus.one:26657';
const SGAPI = 'https://sgapiv2.certus.one/v1';
const KBAPI = 'https://keybase.io/_/api/1.0';
const CGAPI = 'https://api.coingecko.com/api/v3';

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
  let endpoints = [];

  endpoints.push('/latest - Latests block height. STRING');
  endpoints.push('/meantime - Average block time. STRING');

  // @todo: change to /validators/active
  endpoints.push('/activevalidators - Number of active validators on the network. STRING');

  // @todo: change to /validators/total
  endpoints.push('/totalvalidators - Total number of validators on the network. STRING');

  // @todo: change to /validators/power
  endpoints.push('/onlinevotingpower - Total voting power of all validators on the network. STRING');
  endpoints.push('/consensus/height - Consensus height. STRING');
  endpoints.push('/consensus/round - Consensus round. STRING');
  endpoints.push('/consensus/step - Consensus step. STRING');
  endpoints.push('/consensus/proposer_address - Consensus proposer address. STRING');
  endpoints.push('/consensus/proposer_name - Consensus proposer name. STRING');
  endpoints.push('/consensus/proposer_url - Consensus proposer URL. STRING');
  endpoints.push('/consensus/proposer_avatar - Consensus proposer logo image. STRING');
  endpoints.push('/consensus/voted_power - Consensus proposer voting power. STRING');
  endpoints.push('/validators/random - Returns a random validator. JSON');
  endpoints.push('/graph - Block time. JSON');
  endpoints.push('/transactions - List of transactions by latest. JSON');

  // @todo: change ot /blocks
  endpoints.push('/listblocks - List of 50 block by latest height. JSON');
  endpoints.push('/blocks/:height - Given a height, return the block info. JSON' );
  endpoints.push('/account/:account - Given an account address hash, return address info. JSON');
  endpoints.push('/market - Returns latest market information. JSON');

  let output = endpoints.map(out => out);

  res.send(output);
});

/**
 * Latest block height.
 */
app.get('/latest', function (req, res) {
  axios.get(SGAPI + '/blocks?limit=1', { httpsAgent: agent })
    .then(function (response) {
      var latestBlockHeight;
      latestBlockHeight = response.data.blocks[0].height;
      res.send(latestBlockHeight);
    })
});

/**
 * Average block time.
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
 * Number of active validators on the network.
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

              res.send(JSON.stringify(output_json))
            }));
        }));
    });
});

/**
 * Graph block time.
 */
app.get('/graph', function (req, res) {
  axios.get(RPC + '/status', { httpsAgent: agent })
    .then(function (response) {
      var latestBlockHeight;
      var minLastBlocks;
      latestBlockHeight1 = response.data.result.sync_info.latest_block_height;
      minLastBlocks1 = latestBlockHeight1 - 20;
      latestBlockHeight2 = response.data.result.sync_info.latest_block_height - 21;
      minLastBlocks2 = latestBlockHeight2 - 20;
      latestBlockHeight3 = response.data.result.sync_info.latest_block_height - 21;
      minLastBlocks3 = latestBlockHeight2 - 10;
      axios.all([
        axios.get(RPC + '/blockchain?minHeight=' + minLastBlocks1 + '&maxHeight=' + latestBlockHeight1, { httpsAgent: agent }),
        axios.get(RPC + '/blockchain?minHeight=' + minLastBlocks2 + '&maxHeight=' + latestBlockHeight2, { httpsAgent: agent }),
        axios.get(RPC + '/blockchain?minHeight=' + minLastBlocks3 + '&maxHeight=' + latestBlockHeight3, { httpsAgent: agent }),
      ])
        .then(axios.spread(function (data1, data2, data3) {
          var times = [];
          var maxTime = 0;
          for (let i = 10; --i; i > 0)
          {
            var oldest = new Date(data3.data.result.block_metas[i].header.time);
            var newer = new Date(data3.data.result.block_metas[i - 1].header.time);
            var delta = {
              block_tick: (newer - oldest)/1000,
              block_time: data3.data.result.block_metas[i].header.time
            };

            maxTime = maxTime + delta['block_tick'];
            times.push(delta);
          }
          for (let i = 20; --i; i > 0)
          {
            var oldest = new Date(data2.data.result.block_metas[i].header.time);
            var newer = new Date(data2.data.result.block_metas[i - 1].header.time);
            var delta = {
              block_tick: (newer - oldest)/1000,
              block_time: data2.data.result.block_metas[i].header.time
            };
            maxTime = maxTime + delta['block_tick'];
            times.push(delta);
          }
          for (let i = 20; --i; i > 0)
          {
            var oldest = new Date(data1.data.result.block_metas[i].header.time);
            var newer = new Date(data1.data.result.block_metas[i - 1].header.time);
            var delta = {
              block_tick: (newer - oldest)/1000,
              block_time: data1.data.result.block_metas[i].header.time
            };
            maxTime = maxTime + delta['block_tick'];
            times.push(delta);
          }
          var meanTime = maxTime / 50;
          var output = {
            mean: meanTime.toFixed(2),
            times: times
          }
          res.send(JSON.stringify(output));
        }
      )
    )
  })
});


/**
 * Get list of transactions.
 * - params: 
 *   - limit
 *   - offset 
 *   - height
 *   - hash
 *   - sender
 * 
 * Note: where we get the data is dependant upon the tx type.
 * Types are:
 * - withdraw_delegator_reward / delegate
 * - send
 * 
 * Desired data points:
 * - type: transaction.messages[0].type
 * - speed: (can't find anything like this)
 * - from: transaction.messages[0].data.from_address
 * - to: transaction.messages[0].data.to_address
 * - value: transaction.messages[0].data.amount.amount + denom
 * - fee: transaction.fees.amount[0].amount + denom
 * - time: transaction.time
 */
app.get('/transactions', function (req, res) {
  let uri = SGAPI + req._parsedUrl._raw;  
  axios.get(uri, { httpsAgent: agent })
  .then(function (response) {
    let data = {};
    let customResponses = [];
    let txs = response.data.transactions;
    // transations is an array
    txs.forEach(tx => {
      // console.log(tx);
      let customResponse = {};
      customResponse.height = tx.height
      customResponse.hash = tx.hash;
      customResponse.ok = tx.ok; //true if valid, false if invalid tx
      customResponse.type = tx.messages[0].type;
      if (typeof(tx.fees.amount[0]) !== 'undefined') {
        customResponse.fee = tx.fees.amount[0].amount + ' ' + tx.fees.amount[0].denom + ' + ' + tx.fees.gas + ' gas';
      } else {
        customResponse.fee = 'No fee + ' + tx.fees.gas + ' gas';
      }
      customResponse.time = tx.time;
      
      switch (tx.messages[0].type) {
        case 'withdraw_delegator_reward':
          if (tx.messages[1]) {
            data = JSON.parse(tx.messages[1].data);
            if (typeof(data.amount) !== 'undefined') {
              customResponse.value = data.amount.amount + ' ' + data.amount.denom;
            } else {
              console.log(data);
            }
          } else {
            data = JSON.parse(tx.messages[0].data);
          }
          customResponse.to = data.delegator_address;
          customResponse.from = data.validator_address;
          break;
        case 'send':
          data = JSON.parse(tx.messages[0].data);
          if (typeof(data.amount[0]) !== 'undefined') {
            customResponse.value = data.amount[0].amount + ' ' + data.amount[0].denom;
          } else {
            console.log(data);
          }
          customResponse.to = data.to_address;
          customResponse.from = data.from_address;
          break;
      }
      customResponses.push(customResponse);
    });
    res.send(customResponses);
  })
});

/**
 * Get list of blocks.
 */
app.get('/listblocks', function (req, res) {
  axios.get(SGAPI + '/blocks?limit=50', { httpsAgent: agent })
  .then(function (response) {
    var blocks = [];

    for (let i = 0; i < 50; i++)
    {
      blocks.push(response.data.blocks[i]);
    }
    axios.get(SGAPI + '/blocks?limit=50&afterBlock=' + blocks[49].height, { httpsAgent: agent })
      .then (function (response) {
        for (let i = 0; i < 50; i++)
        {
          blocks.push(response.data.blocks[i]);
        }
        res.send(JSON.stringify(blocks));
      })
  })
});

/**
 * Get block info at a given height.
 */
app.get('/blocks/:height', function (req, res) {
  let height = req.params.height;
  // not sure why the API doesn't just take the exact number
  height++;
  axios.get(SGAPI + '/blocks?limit=1&afterBlock=' + height, { httpsAgent: agent })
    .then(function (response) {
      res.send(JSON.stringify(response.data));
    });
});

/**
 * Get account info
 */
app.get('/account/:account', function (req, res){
    let req_account = req.params.account;
    axios.all([
        axios.get(SGAPI + '/account/' + req_account, { httpsAgent: agent }),
        axios.get(SGAPI + '/account/' + req_account + '/rewards', { httpsAgent: agent }),
        axios.get(SGAPI + '/delegations?delegatorAddress=' + req_account, { httpsAgent: agent }),
        axios.get(SGAPI + '/transactions?&sender=' + req_account, { httpsAgent: agent }),
        axios.get(SGAPI + '/transactions?offset=20&sender=' + req_account, { httpsAgent: agent }),
        axios.get(SGAPI + '/transactions?offset=40&sender=' + req_account, { httpsAgent: agent }),
        axios.get(SGAPI + '/transactions?offset=60&sender=' + req_account, { httpsAgent: agent }),
        axios.get(SGAPI + '/transactions?offset=80&sender=' + req_account, { httpsAgent: agent }),
        axios.get(CGAPI + '/simple/price?ids=cosmos&vs_currencies=usd', { httpsAgent: agent }),
    ])
        .then(axios.spread(function (data1, data2, data3, data4, data5, data6, data7, data8, data9) {
            let available = 0;
            if (data1.data.account.balance.length > 0)
            {
                available = parseInt(data1.data.account.balance[0].amount);
            }
            let delegated = 0;
            if (data1.data.account.vested)
            {
                delegated = parseInt(data1.data.account.vestingInfo.delegatedFree[0].amount);
            }
            let rewards = 0;
            if (data2.data.rewards.length > 0)
            {
                rewards = parseInt(data2.data.rewards[0].amount)
            }
            let transactions = [];
            if (data4.data.transactions.length > 0) {
                for (let i = 0; i < data4.data.transactions.length; i++)
                {
                    transactions[i] = data4.data.transactions[i]
                }
            }
            if (data5.data.transactions.length > 0) {
                for (let i = 0; i < data5.data.transactions.length; i++)
                {
                    transactions[20 + i] = data5.data.transactions[i]
                }
            }
            if (data6.data.transactions.length > 0) {
                for (let i = 0; i < data6.data.transactions.length; i++)
                {
                    transactions[40 + i] = data6.data.transactions[i]
                }
            }
            if (data7.data.transactions.length > 0) {
                for (let i = 0; i < data7.data.transactions.length; i++)
                {
                    transactions[60 + i] = data7.data.transactions[i]
                }
            }
            if (data8.data.transactions.length > 0) {
                for (let i = 0; i < data8.data.transactions.length; i++)
                {
                    transactions[80 + i] = data8.data.transactions[i]
                }
            }
            for (let i = 0; i < transactions.length; i++)
            {
                for (let a = 0; a < transactions[i].messages.length; a++)
                {
                    transactions[i].messages[a].data = JSON.parse(transactions[i].messages[a].data);
                }
            }
            let info = {
                address: data1.data.account.address,
                balance: {
                    available: available,
                    delegated: delegated,
                    rewards: rewards,
                    total: available + delegated + rewards,
                    usdEq: ((available + delegated + rewards)/1000) * parseFloat(data9.data.cosmos.usd),
                    atomPrice: parseFloat(data9.data.cosmos.usd)
                },
                delegations: data3.data.delegations,
                transactions: transactions

            };
            //console.log(data1.data.account.balance);
            //console.log(data2.data);
            //console.log(info.balance);
            //console.log(data3.data);
            res.send(JSON.stringify(info));
        }))
});

/**
 * Market info
 */
app.get('/market', function (req, res){
	axios.get(CGAPI + '/coins/cosmos?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false', { httpsAgent: agent })
		.then(function (response) {
		    console.log(response.data);
			let output = {
				price: response.data.market_data.current_price.usd,
				market_cap: response.data.market_data.market_cap.usd,
				total_volume: response.data.market_data.total_volume.usd
			};
			res.send(JSON.stringify(output));
		})
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}!`));
