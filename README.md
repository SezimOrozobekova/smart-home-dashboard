# Smart Home Dashboard

A responsive Angular application for monitoring and controlling smart home devices, tracking energy usage, and viewing 3D room models.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Module Descriptions](#module-descriptions)
- [User Guide](#user-guide)

---

## Overview

Smart Home Dashboard provides:
- Real-time summary of connected devices and energy usage
- Per-room device management with on/off toggle
- Interactive energy and temperature charts with day/week/month filters
- Energy efficiency insights and recommendations
- Interactive 3D room viewer with device selection

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | Angular 17 (standalone components)  |
| UI Library  | Angular Material                    |
| 3D Rendering| Three.js + GLTFLoader               |
| Charts      | Chart.js                            |
| Language    | TypeScript                          |
| Styling     | CSS (component-scoped)              |
| Testing     | Jasmine + Karma                     |

---

## Project Structure

```
src/app/
├── app.ts                          # Root component
├── app.routes.ts                   # Route definitions
├── header/                         # Navigation header
├── dashboard/                      # Main dashboard page
│   ├── dashboard.ts                # Component logic
│   ├── dashboard.html              # Template
│   ├── dashboard.css               # Styles
│   └── dashboard.spec.ts           # Unit tests (21 test cases)
├── devices/                        # Device management page
│   ├── devices.ts
│   ├── devices.html
│   ├── devices.css
│   └── devices.spec.ts             # Unit tests (12 test cases)
├── insights/                       # Energy insights page
│   ├── insights.ts
│   ├── insights.html
│   ├── insights.css
│   └── insights.spec.ts            # Unit tests (10 test cases)
├── home3d/                         # 3D home viewer
│   ├── home3d.ts
│   ├── scene/                      # Three.js scene component
│   ├── panels/                     # Device control panels
│   │   └── shared/                 # Shared models, factories, data
│   └── services/                   # Room loader, device control, selection
└── starfield/                      # Animated background component
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Angular CLI: `npm install -g @angular/cli`

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
ng serve

# Open in browser
http://localhost:4200
```

### Build for Production

```bash
ng build --configuration production
```

---

## Running Tests

```bash
# Run all unit tests
ng test

# Run tests with code coverage report
ng test --code-coverage

# Run tests once (CI mode, no browser watch)
ng test --watch=false --browsers=ChromeHeadless
```

Coverage report is generated in `/coverage/` directory.

---

## Module Descriptions

### Dashboard (`/`)
Displays a full overview of the smart home:
- **Summary Cards** — total devices, active devices, rooms, energy usage today, cost estimate
- **Energy Chart** — line chart with day/week/month filter, shows total kWh and peak window
- **Temperature Chart** — line chart with day/week/month filter, shows avg/min/max
- **Top Consumers** — top 5 devices by energy consumption
- **Recent Activities** — timestamped activity log
- **Floor Plan** — static floor plan image with first/second floor toggle

### Devices (`/devices`)
Shows all devices grouped by room. Each device card displays:
- Icon, name, wattage
- ON/OFF status badge
- Toggle button to switch the device state

### Insights (`/insights`)
Shows automated energy analysis cards with three severity levels:
- `warning` — action required
- `info` — informational
- `success` — positive feedback

Each card includes a title, description, and a specific recommendation.

### 3D Home (`/home3d`)
Interactive Three.js scene. Features:
- Room selector (Gaming Room, Bathroom, Kitchen)
- GLB model loading from `assets/models/`
- Click-to-select devices in the 3D scene
- Device control panels (Lamp color/toggle, Fridge temperature, Stove temperature, Kettle)
- Orbit controls for camera rotation/zoom

---

## User Guide

### Navigating the App
Use the top navigation bar to switch between Dashboard, Devices, 3D Home, and Insights.

### Toggling a Device
1. Go to **Devices**
2. Find the device in its room section
3. Click **Turn on** or **Turn off**

### Viewing Energy Charts
1. Go to **Dashboard**
2. Scroll to the Energy Usage or Temperature section
3. Use the dropdown (Today / This Week / This Month) to change the time range

### Using the 3D View
1. Go to **3D Home**
2. Select a room from the sidebar
3. Click on any object in the scene to open its control panel
4. Use the panel to toggle lamps, adjust fridge/stove temperature

### Reading Insights
Go to **Insights** to see colour-coded cards. Orange = warning, blue = info, green = good.
