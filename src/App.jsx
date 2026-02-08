import React, { useState, Component, useEffect } from "react";
import { TamboProvider, useTambo, useTamboVoice, useTamboSuggestions, withInteractable, useTamboComponentState } from "@tambo-ai/react";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import "./App.css";

// Fix for Leaflet icon issue in Vite/Webpack
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "red" }}>
          <h1>Something went wrong.</h1>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function GenerativeApp() {
  const [view, setView] = useState("chat");
  const [input, setInput] = useState("");
  const { thread, sendThreadMessage, isIdle, generationStage } = useTambo();

  // Voice Hook
  const { startRecording, stopRecording, isRecording, transcript } = useTamboVoice();

  // Suggestions Hook
  const { suggestions = [], accept } = useTamboSuggestions();

  // Sync transcript to input
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const messages = thread?.messages || [];
  const isLoading = !isIdle;
  const isStreaming = generationStage === "STREAMING_RESPONSE";

  const handleGenerate = () => {
    if (!input.trim()) return;
    sendThreadMessage(input);
    setInput("");
  };

  const handleStarterClick = (prompt) => {
    sendThreadMessage(prompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleClearChat = () => {
    // Optional: Clear storage on explicit reset if desired
    // localStorage.removeItem("forceui_alerts");
    // localStorage.removeItem("forceui_ambulances");
    window.location.reload();
  };

  const renderMessageContent = (content) => {
    if (typeof content === "string") {
      return <ReactMarkdown>{content}</ReactMarkdown>;
    }
    if (Array.isArray(content)) {
      return content.map((part, i) => {
        if (part.type === "text") return <ReactMarkdown key={i}>{part.text}</ReactMarkdown>;
        return null;
      });
    }
    return <pre>{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <span>⚡ ForceUI</span>
        </div>
        <div className="nav-menu">
          <div className={`nav-item ${view === 'chat' ? 'active' : ''}`} onClick={() => setView('chat')}>💬 Chat</div>
          <div className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>📊 Dashboard</div>
          <div className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>⚙️ Settings</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <header className="header">
          <h1>{view.charAt(0).toUpperCase() + view.slice(1)} <span className="header-badge">AI Powered</span></h1>
          {view === 'chat' && (
            <button className="clear-btn" onClick={handleClearChat} title="Clear Chat">
              <span>Reset</span> 🗑️
            </button>
          )}
        </header>

        {view === 'chat' && (
          <>
            <div className="chat-feed">
              {messages.length === 0 && (
                <div className="empty-state">
                  <h3>What can I build for you?</h3>
                  <p>Select a starter or type your own request.</p>

                  <div className="starter-cards">
                    <div className="starter-card" onClick={() => handleStarterClick("Show me the live ambulance dashboard")}>
                      <span className="card-icon">🚑</span>
                      <span className="card-title">Live Dashboard</span>
                      <span className="card-desc">Monitor alerts and ambulances in real-time.</span>
                    </div>
                    <div className="starter-card" onClick={() => handleStarterClick("Where is the emergency? Show map.")}>
                      <span className="card-icon">🗺️</span>
                      <span className="card-title">Live Map</span>
                      <span className="card-desc">Visualize emergency locations on a map.</span>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div key={index} className={`message-row ${isUser ? "user" : "ai"}`}>
                    <div className={`avatar ${isUser ? "user" : "ai"}`}>
                      {isUser ? "U" : "AI"}
                    </div>
                    <div className="message-content-wrapper" style={{ maxWidth: "80%" }}>
                      <div className="message-bubble">
                        {renderMessageContent(msg.content)}

                        {msg.toolCalls?.map((toolCall, i) => (
                          <div key={i} className="tool-call">
                            <div className="tool-name">🔧 Tool: {toolCall.name}</div>
                            <code>{JSON.stringify(toolCall.args)}</code>
                          </div>
                        ))}

                        {msg.ui && (
                          <div className="gen-ui-container">
                            {msg.ui}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="message-row ai">
                  <div className="avatar ai">AI</div>
                  <div className="message-bubble" style={{ fontStyle: "italic", color: "#6b7280" }}>
                    {isStreaming ? "Generating..." : "Thinking..."}
                  </div>
                </div>
              )}
            </div>

            <div className="input-area">
              {/* Suggestions Chips */}
              {suggestions && suggestions.length > 0 && (
                <div className="suggestions-row">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      className="suggestion-chip"
                      onClick={() => accept({ suggestion, shouldSubmit: true })}
                    >
                      ✨ {suggestion.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="input-wrapper">
                <textarea
                  className="chat-input"
                  placeholder={isRecording ? "Listening..." : "Type a message..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || isStreaming}
                />

                <button
                  className={`mic-btn ${isRecording ? "recording" : ""}`}
                  onClick={handleMicClick}
                  disabled={isLoading || isStreaming}
                  title="Voice Input"
                >
                  {isRecording ? "⏹️" : "🎤"}
                </button>

                <button
                  className="send-btn"
                  onClick={handleGenerate}
                  disabled={isLoading || isStreaming || !input.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}

        {view === 'dashboard' && (
          <div style={{ padding: '2rem' }}>
            <div className="dashboard-grid">
              <Dashboard />
              {/* Note: In a real app we'd lift state up, but for now we rely on local storage persistence */}
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div style={{ padding: '2rem' }}>
            <div className="settings-panel">
              <div className="setting-item">
                <label>App Theme</label>
                <select disabled><option>Light (Default)</option><option>Dark</option></select>
              </div>
              <div className="setting-item">
                <label>Data Persistence</label>
                <div style={{ color: 'green', fontSize: '0.9rem' }}>✅ Active (LocalStorage)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Components ---

// Dashboard with Persistence
const Dashboard = ({ alerts: propAlerts, ambulances: propAmbulances }) => {
  // Load initial state from LocalStorage if available, else use props/default
  const getInitial = (key, fallback) => {
    const saved = localStorage.getItem(`forceui_${key}`);
    return saved ? JSON.parse(saved) : (fallback || 0);
  };

  const [alerts, setAlerts] = useTamboComponentState("alerts", getInitial("alerts", propAlerts));
  const [ambulances, setAmbulances] = useTamboComponentState("ambulances", getInitial("ambulances", propAmbulances));
  const { sendThreadMessage } = useTambo();

  // Persist changes
  useEffect(() => {
    localStorage.setItem("forceui_alerts", JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem("forceui_ambulances", JSON.stringify(ambulances));
  }, [ambulances]);

  const handleEmergency = () => {
    sendThreadMessage("TRIGGER EMERGENCY: High severity alert at Central Station!");
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-header">
        <h3>🚑 Ambulance Status ({alerts > 0 ? 'Active' : 'Live'})</h3>
      </div>
      <div className="stat-grid">
        <div className="stat-box alert">
          <span className="stat-value">{alerts}</span>
          <span className="stat-label">Active Alerts</span>
        </div>
        <div className="stat-box safe">
          <span className="stat-value">{ambulances}</span>
          <span className="stat-label">Available</span>
        </div>
      </div>
      <button className="action-btn" onClick={handleEmergency}>
        📢 Trigger Emergency
      </button>
    </div>
  );
};
const InteractableDashboard = withInteractable(Dashboard, {
  componentName: "dashboard",
  description: "A live dashboard showing ambulance status and active alerts.",
  propsSchema: z.object({
    alerts: z.number().optional().describe("Number of active SOS alerts"),
    ambulances: z.number().optional().describe("Number of available ambulances"),
  }),
});

// Map Component (Leaflet)
const MapComponent = ({ lat, lng, zoom, label }) => {
  return (
    <div className="map-wrapper" style={{ height: "300px", width: "100%", marginTop: "12px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
      <MapContainer center={[lat, lng]} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            {label}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

// Chat Component
const Chat = ({ status }) => (
  <div style={{ padding: 20, textAlign: 'center', background: '#f0fdf4', borderRadius: 8, border: '1px dashed #16a34a' }}>
    <h3 style={{ color: '#166534' }}>💬 AI Assistant</h3>
    <p>{status}</p>
    <button className="action-btn" style={{ backgroundColor: '#16a34a', marginTop: 10 }} onClick={() => window.location.reload()}>Reset Status</button>
  </div>
);

// Wireframe / Mockup Component
const Wireframe = ({ title, sections }) => (
  <div className="wireframe-container">
    <div className="wireframe-header">
      <div className="wireframe-dot red"></div>
      <div className="wireframe-dot yellow"></div>
      <div className="wireframe-dot green"></div>
      <span className="wireframe-title">{title}</span>
    </div>
    <div className="wireframe-body">
      {sections.map((section, idx) => (
        <div key={idx} className="wireframe-section">
          <div className="wireframe-placeholder"></div>
          <p>{section}</p>
        </div>
      ))}
    </div>
    <div className="wireframe-footer">Mockup Preview</div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <TamboProvider
        apiKey={import.meta.env.VITE_TAMBO_API_KEY}
        components={[
          {
            name: "dashboard",
            component: InteractableDashboard,
            description: "A live dashboard showing ambulance status and active alerts. Use this when the user asks for status.",
            propsSchema: z.object({
              alerts: z.number().optional().describe("Number of active SOS alerts"),
              ambulances: z.number().optional().describe("Number of available ambulances"),
            }),
          },
          {
            name: "map",
            component: MapComponent,
            description: "Displays a map with a marker. Use this when the user asks for location, coordinates, or 'where is X'.",
            propsSchema: z.object({
              lat: z.number().describe("Latitude"),
              lng: z.number().describe("Longitude"),
              zoom: z.number().default(13).describe("Zoom level"),
              label: z.string().describe("Label for the location marker"),
            }),
          },
          {
            name: "chat",
            component: Chat,
            description: "A chat interface for talking to an AI assistant.",
            propsSchema: z.object({
              status: z.string().optional().default("Idle").describe("Current status of the assistant"),
            }),
          },
          {
            name: "wireframe",
            component: Wireframe,
            description: "Use this to visually render a UI mockup whenever the user asks for a specific UI design (e.g. 'student system', 'login page', 'dashboard'). Do NOT explain the UI in text, use this component to SHOW it.",
            propsSchema: z.object({
              title: z.string().optional().default("Mockup").describe("Title of the UI page (e.g. 'Student Dashboard')"),
              sections: z.array(z.string()).optional().default([]).describe("List of main sections or components on the page"),
            }),
          }
        ]}
        tools={[
          {
            name: "triggerEmergency",
            description: "Triggers an emergency alert for a specific location.",
            inputSchema: z.object({
              location: z.string().describe("Location of the emergency"),
              severity: z.enum(["low", "medium", "high"]).describe("Severity of the emergency"),
            }),
            outputSchema: z.string().describe("Confirmation message"),
            tool: async ({ location, severity }) => {
              alert(`🚨 EMERGENCY TRIGGERED 🚨\n\nLocation: ${location}\nSeverity: ${severity}\n\nDispatching units now...`);
              return `Emergency triggered at ${location}`;
            },
          },
        ]}
      >
        <GenerativeApp />
      </TamboProvider>
    </ErrorBoundary>
  );
}
