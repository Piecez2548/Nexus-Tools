import { Component, type ReactNode } from "react";

interface Props {
  th: boolean;
  onClose: () => void;
  children: ReactNode;
}

// A tool chunk that still fails after the one automatic reload (see
// staleChunkReload.ts) would otherwise unmount the whole app to a blank page.
export default class ToolLoadBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { th, onClose } = this.props;
    return (
      <div className="loading-notice" role="alert">
        <p>{th ? "เปิดเครื่องมือนี้ไม่สำเร็จ อาจมีเวอร์ชันใหม่ กรุณารีเฟรชหน้า" : "This tool couldn't be opened. A new version may be available; please refresh."}</p>
        <button type="button" className="button" onClick={() => window.location.reload()}>{th ? "รีเฟรช" : "Refresh"}</button>
        <button type="button" className="button secondary" onClick={onClose}>{th ? "ปิด" : "Close"}</button>
      </div>
    );
  }
}
