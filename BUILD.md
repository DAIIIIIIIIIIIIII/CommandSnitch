
# Build Instructions

## Download Pre-built Releases

Visit the [Releases page](../../releases) to download pre-built executables for:
- **Windows**: `.exe` installer

## Build Locally

### Prerequisites
- Node.js 18 or higher
- npm
- Windows operating system (required for building)

### Steps
1. Clone the repository
2. Install dependencies: `npm install`
3. Build the React app: `npm run build`
4. Build Electron app: `npx electron-builder --win`

Built files will be in the `dist-electron/` directory.

### Development Mode
Run in development mode with: `npx concurrently "npm run dev" "npx electron public/electron.js"`

### Note
This application is designed specifically for Windows systems and only builds Windows executables.
