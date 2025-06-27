
# Build Instructions

## Download Pre-built Releases

Visit the [Releases page](../../releases) to download pre-built executables for:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` package  
- **Linux**: `.AppImage` file

## Build Locally

### Prerequisites
- Node.js 18 or higher
- npm

### Steps
1. Clone the repository
2. Install dependencies: `npm install`
3. Build the React app: `npm run build`
4. Build Electron app:
   - Windows: `npx electron-builder --win`
   - macOS: `npx electron-builder --mac`
   - Linux: `npx electron-builder --linux`

Built files will be in the `dist-electron/` directory.

### Development Mode
Run in development mode with: `npx concurrently "npm run dev" "npx electron public/electron.js"`
