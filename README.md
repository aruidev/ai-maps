# AI Maps

AI Maps is a small full-stack web app built with Node.js and TypeScript.  
Users ask for a place in a chat input, the app gets geographic coordinates from an AI model, and then displays the location on a Mapbox map. Users can also place and manage markers on the map.

<img width="800" height="913" alt="image" src="https://github.com/user-attachments/assets/01901ef5-ac1f-4d8f-9b61-fa8b55b633ae" />

<img width="800" height="915" alt="image" src="https://github.com/user-attachments/assets/19a425df-4403-4b48-8042-54547224f86a" />

## Run locally

1. Create environment variables:

- MAPBOX_ACCESS_TOKEN
- GITHUB_TOKEN (with 'models' permission)
- PORT (optional, default 3000)

2. Build and start:

```bash
npm run build
```

```bash
npm run start
```

3. Open http://localhost:3000

## How it works

1. The frontend sends a query to the backend API.
2. The backend calls the AI model with a strict geolocation prompt.
3. The AI response is validated to ensure valid latitude/longitude ranges.
4. The frontend centers the map on the returned coordinates.
5. The user can place markers manually and remove them from a dynamic marker list.

## Technical decisions

- Single repository with client and server.
- Express backend as a secure integration layer for external APIs.
- Strict JSON response contract from AI to reduce parsing errors.
- Coordinate validation on the server before returning data to the client.
- Mapbox token delivered from backend configuration endpoint.
- Marker persistence in localStorage for a lightweight client-side state.
- Marker limit set to 10 to keep UI and storage under control.

## Project structure

- client: HTML, CSS, browser TypeScript
- server: Express API and AI integration
- environments: environment variable files

## Reference

Mapbox API docs: https://docs.mapbox.com/api/guides/
