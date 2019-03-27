# cosmos-middleware-neos

I'm building a front-end in Neos for some data visualizations and monitoring of the cosmos.network which is a proof of stake blockchain project. They have a REST API and a meteor app that works on top of the API to display various data points. Since Neos cannot directly handle working with a REST API yet, I need to create a middleware (preferably with Node.js but open to other options)  that can get the data from the REST API and provide it's own endpoints to serve up the pieces of data as text which I can then call into Neos using LogiX. The middleware may have to do some calculations on data before serving up certain endpoints, but those calculations are already figured out in the Meteor app, just have to reverse engineer it a little to find them.

This project is a Node.js middleware to retrieve the data from the REST API and serve up just 4 particular data points to start with. Then expanding from there.

- https://cosmos.network/ - to learn more about cosmos if you're interested.
- https://cosmos.bigdipper.live/ - is the existing, running Meteor app. This has 4 main blocks on the homepage and those would be the data points I want to start with.
- https://www.github.com/forbole/big_dipper - source code of the above app to reverse engineer.
- https://cosmos.network/rpc/ - swagger definition for the Cosmos REST API
