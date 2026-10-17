import { createAppServer } from './app.js';

const port = Number(process.env.PORT) || 3001;

// Railway injects PORT and expects the app on 0.0.0.0
createAppServer(process.env).listen(port, '0.0.0.0', () => {
  console.log(`notify server listening on :${port}`);
});
