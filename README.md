# ⚡ ForceUI - Generative AI Dashboard

ForceUI is a cutting-edge **Generative UI** application designed for emergency response coordination. It uses AI to dynamically build user interfaces, generate interactive maps, and control dashboard state in real-time via voice or text commands.

![ForceUI Demo](https://via.placeholder.com/800x400?text=ForceUI+Generative+Interface)

## 🌟 Key Features

*   **Generative UI**: specific UI components (Wireframes, Dashboards) are rendered on-the-fly based on user intent.
*   **Voice Control**: Integrated speech-to-text for hands-free operation.
*   **Live Maps**: Interactive Leaflet maps generated instantly for specific locations.
*   **Real-time State**: "Interactable" components where the AI can modify React state (e.g., updating ambulance counts) directly.
*   **Data Persistence**: Dashboard state saves to LocalStorage, surviving page reloads.

## 🛠️ Tech Stack

*   **Framework**: React + Vite
*   **AI Engine**: @tambo-ai/react
*   **Styling**: Custom CSS (Glassmorphism design system)
*   **Maps**: Leaflet / React-Leaflet
*   **Validation**: Zod Schemas

## 🚀 How to Run Locally

1.  **Prerequisites**: Node.js installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Set API Key**:
    *   Create a `.env` file in the root directory.
    *   Add: `tambo_YBC557vS/sjl2RSSJgeplP0SYqytpGzP2BBhF3osHis4bflwNV1b6o7HMVNrsCYnmV2PlZslUE4s4M6PBi/zel8XLA8HP+RRpachi4POzWs=`
4.  **Start Server**:
    ```bash
    npm run dev
    ```
5.  **View**: Open `http://localhost:5173`.

