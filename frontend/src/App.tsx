import Visualizer from "./components/Visualizer";
import TranscriptPanel from "./components/TranscriptPanel";
import PushToTalkButton from "./components/PushToTalkButton";
import SettingsPanel from "./components/SettingsPanel";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>
          MUSE <span className="app-header-subtitle">Michael&apos;s Unified Strategy Engine</span>
        </h1>
      </header>

      <main className="app-main">
        <section className="app-column app-column--primary">
          <Visualizer />
          <PushToTalkButton />
        </section>

        <section className="app-column app-column--secondary">
          <TranscriptPanel />
          <SettingsPanel />
        </section>
      </main>

      <footer className="app-footer">
        <p>Phase 1 &middot; UI Preview &middot; Voice SDK integration pending</p>
      </footer>
    </div>
  );
}
