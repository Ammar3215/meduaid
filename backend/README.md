# MeduAid QB Portal Backend

## Tech Stack
- Node.js
- Express
- TypeScript
- MongoDB (Mongoose)
- JWT Auth

## Setup
1. `cd backend`
2. Copy `.env` and set your `MONGO_URI`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run in development mode:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```
6. Start production server:
   ```bash
   npm start
   ```

## Scripts
- `dev`: Start with nodemon (TypeScript)
- `build`: Compile TypeScript to JS
- `start`: Run compiled JS

## Project Structure
```
backend/
  src/
    app.ts          # Express app setup
    server.ts       # Entry point, DB connection
    models/         # Mongoose models
    routes/         # Express routes
    controllers/    # Route logic
    middleware/     # Auth, error handling, etc.
    utils/          # Helper functions
  .env              # Environment variables
  tsconfig.json     # TypeScript config
  package.json      # NPM scripts & dependencies
``` 