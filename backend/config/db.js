const mongoose = require('mongoose');

let databaseReady = false;
let activeConnectionPromise = null;
let listenersRegistered = false;
let databaseStatus = {
  state: 'idle',
  lastError: null,
  lastAttemptAt: null,
  lastConnectedAt: null,
  attempts: 0
};

const updateDatabaseStatus = (nextStatus) => {
  databaseStatus = {
    ...databaseStatus,
    ...nextStatus
  };
};

const registerConnectionListeners = () => {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    databaseReady = true;
    updateDatabaseStatus({
      state: 'connected',
      lastError: null,
      lastConnectedAt: new Date().toISOString()
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  });

  mongoose.connection.on('reconnected', () => {
    databaseReady = true;
    updateDatabaseStatus({
      state: 'connected',
      lastError: null,
      lastConnectedAt: new Date().toISOString()
    });
    console.log('MongoDB reconnected');
  });

  mongoose.connection.on('disconnected', () => {
    databaseReady = false;
    updateDatabaseStatus({
      state: 'disconnected'
    });
    console.warn('MongoDB disconnected.');
  });

  mongoose.connection.on('error', (error) => {
    databaseReady = mongoose.connection.readyState === 1;
    updateDatabaseStatus({
      state: databaseReady ? 'connected' : 'error',
      lastError: error.message
    });
    console.error(`MongoDB connection error: ${error.message}`);
  });
};

const connectDB = async () => {
  registerConnectionListeners();

  try {
    const mongoUri = process.env.MONGODB_URI?.trim();

    if (!mongoUri || mongoUri === 'YOUR_MONGODB_ATLAS_URI_HERE') {
      databaseReady = false;
      updateDatabaseStatus({
        state: 'missing-config',
        lastError: 'MONGODB_URI is not configured'
      });
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI is required in production. Refusing to start without durable persistence.');
      }
      console.warn('MongoDB is not configured. Starting development with the local fallback store.');
      return false;
    }

    if (mongoose.connection.readyState === 1) {
      databaseReady = true;
      updateDatabaseStatus({
        state: 'connected',
        lastError: null
      });
      return true;
    }

    if (activeConnectionPromise) {
      return activeConnectionPromise;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const serverSelectionTimeoutMs = Number(
      process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || (isProduction ? 15000 : 3000)
    );
    const connectTimeoutMs = Number(
      process.env.MONGODB_CONNECT_TIMEOUT_MS || (isProduction ? 10000 : 3000)
    );

    const maxRetries = Number(process.env.MONGODB_MAX_RETRIES || (isProduction ? 5 : 1));
    const baseDelayMs = Number(process.env.MONGODB_RETRY_BASE_DELAY_MS || (isProduction ? 2000 : 500));

    activeConnectionPromise = (async () => {
      let lastError = null;

      for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        updateDatabaseStatus({
          state: 'connecting',
          lastAttemptAt: new Date().toISOString(),
          lastError: null,
          attempts: attempt
        });

        try {
          await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: serverSelectionTimeoutMs,
            connectTimeoutMS: connectTimeoutMs,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 1,
            retryWrites: true,
            w: 'majority',
            autoIndex: process.env.NODE_ENV !== 'production'
          });

          return true;
        } catch (error) {
          lastError = error;
          databaseReady = false;
          updateDatabaseStatus({
            state: 'retrying',
            lastError: error.message
          });
          console.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);

          if (attempt < maxRetries) {
            const delayMs = baseDelayMs * (2 ** (attempt - 1));
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      throw lastError || new Error('MongoDB connection failed');
    })();

    return await activeConnectionPromise;
  } catch (error) {
    databaseReady = false;
    updateDatabaseStatus({
      state: process.env.NODE_ENV === 'production' ? 'failed' : 'fallback',
      lastError: error.message
    });
    console.error(`MongoDB unavailable after retries: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    console.warn('Development fallback store is active because MongoDB is unavailable.');
    return false;
  } finally {
    activeConnectionPromise = null;
  }
};

const isDatabaseReady = () => databaseReady;

const shouldRequireDatabase = () => process.env.NODE_ENV === 'production' || process.env.REQUIRE_MONGODB === 'true';

const getDatabaseStatus = () => ({
  ...databaseStatus,
  ready: databaseReady,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || null,
  databaseName: mongoose.connection.name || null,
  required: shouldRequireDatabase()
});

module.exports = { connectDB, isDatabaseReady, getDatabaseStatus, shouldRequireDatabase };
