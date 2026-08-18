import Visualizer from "./components/Visualizer";
import TranscriptPanel from "./components/TranscriptPanel";
import PushToTalkButton from "./components/PushToTalkButton";
import SettingsPanel from "./components/SettingsPanel";
import CopilotPanel from "./components/CopilotPanel";
import VoicePanel from "./components/VoicePanel";
import Sidebar from "./components/layout/Sidebar";
import ContextPanel from "./components/layout/ContextPanel";
import StatusBar from "./components/layout/StatusBar";
import { useElectronBridge } from "./hooks/useElectronBridge";
import "./App.css";

export default function App() {
  useElectronBridge();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>
          MUSE <span className="app-header-subtitle">Michael&apos;s Unified Strategy Engine</span>
        </h1>
      </header>

      <main className="app-main">
        <Sidebar />

        <section className="app-column app-column--primary">
          <Visualizer />
          <PushToTalkButton />
        </section>

        <section className="app-column app-column--secondary">
          <TranscriptPanel />
          <VoicePanel />
          <SettingsPanel />
        </section>

        <section className="app-column app-column--copilot">
          <CopilotPanel />
        </section>

        <ContextPanel />
      </main>

      <StatusBar />
    </div>
  );
}
