# Bio Data Analysis Desktop Application

This is the desktop version of the Bio Data Analysis application, built with Electron and integrated with the existing React frontend and Django backend.

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8 or higher
- npm or yarn

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Development mode:
```bash
npm run dev
```
This will start the application in development mode, using the React development server.

3. Production build:
```bash
npm run build
```
This will create a distributable package in the `dist` directory.

## Features

- Integrated React frontend
- Automatic Django backend startup
- Native desktop experience
- Cross-platform support

## Development

The application structure:
- `main.js`: Main Electron process
- `package.json`: Project configuration and dependencies
- React frontend: Located in `../bio-data-analysis-fe`
- Django backend: Located in `../backend`

## Building for Production

1. Build the React frontend:
```bash
cd ../bio-data-analysis-fe
npm run build
```

2. Build the desktop application:
```bash
cd ../desktop-app
npm run build
```

The final executable will be available in the `dist` directory.

## Note

Make sure both the React frontend and Django backend are properly set up before running the desktop application. 