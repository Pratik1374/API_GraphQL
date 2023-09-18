const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const cors = require("cors");
const schema = require("./graphql/schema");
const root = require("./graphql/resolvers");
const authMiddleware = require("./middleware/authMiddleware");
const admin = require("./firebase_initialization"); // Import Firebase from the centralized initialization module

const app = express();

app.use(cors());

// Increase payload size limit (e.g., 10MB)
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  authMiddleware(req, res, next);
});

app.use(
  "/graphql",
  graphqlHTTP((req) => {
    return {
      schema: schema,
      rootValue: root,
      graphiql: true,
      context: { user: req.user },
    };
  })
);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
