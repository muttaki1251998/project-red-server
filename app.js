const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const { databaseSwitcher } = require('./config/middleware');


const env = process.env.NODE_ENV || 'development';

// Load the correct .env file based on the current environment
switch (env) {
  case 'development':
    dotenv.config({ path: path.resolve(__dirname, '.env.local') });
    break;
  case 'production':
    dotenv.config({ path: path.resolve(__dirname, '.env.prod') });
    break;
  default:
    dotenv.config();
}

const app = express();

// List of allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://scholarbangla.vercel.app'
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Increase the payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(databaseSwitcher);

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Api routes
const routes = require('./api/routes');
app.use('/api/', routes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
