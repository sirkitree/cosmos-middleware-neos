# cosmos-middleware-neos

We are building a front-end in Neos for some data visualizations and monitoring of the cosmos.network which is a proof of stake blockchain project. Cosmos has a REST API and a meteor app that works on top of the API to display various data points. Since Neos cannot directly handle working with a REST API [yet](https://github.com/Frooxius/NeosPublic/issues/222), we need to create this middleware that can get the data from the Cosmos REST API and provide it's own endpoints to serve up the pieces of data as text which we can then call into Neos using LogiX. This middleware may have to do some calculations on data before serving up certain endpoints, but those calculations are already figured out in the Meteor app, we just have to reverse engineer it a little to find them.

This project is a Node.js middleware to retrieve the data from the REST API and serve up particular data points.

- https://cosmos.network/ - to learn more about cosmos if you're interested.
- https://cosmos.bigdipper.live/ - is the existing, running Meteor app. This has 4 main blocks on the homepage and those would be the data points I want to start with.
- https://www.github.com/forbole/big_dipper - source code of the above app to reverse engineer.
- https://cosmos.network/rpc/ - swagger definition for the Cosmos REST API

## Partners
- [Simply-VC-Validator](http://www.simply-vc.com.mt/)
- [Stanislav Atanasov](https://github.com/satanasov)
- [sirkitree](https://github.com/sirkitree)

## Endpoints
read server.js

## Running
`npm install`
`node server.js`

## Contributing
Please fork and send a pull request, or ping me to be added as a collaborator so you can branch for pull requests.

## License
[ISC](https://opensource.org/licenses/ISC)
