const express = require('express')
const bodyParser = require("body-parser")

// Create express instance
const app = express()

// Configure body parser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Require API routes
const emotions = require('./routes/emotions')
const users = require('./routes/users')
const test = require('./routes/test')

// Import API Routes
app.use(emotions)
app.use(users)
app.use(test)

// Export express app
module.exports = app

// Start standalone server if directly running
if (require.main === module) {
  const port = process.env.PORT || 3001
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API server listening on port ${port}`)
  })
}
