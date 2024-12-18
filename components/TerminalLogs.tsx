import React, { useRef, useEffect } from 'react';

interface TerminalLogsProps {
  logs: string[];
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'black',
    color: '#10B981',
    fontFamily: 'monospace',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid #10B981',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
    borderBottom: '1px solid #10B981',
    paddingBottom: '0.5rem'
  },
  dotsContainer: {
    display: 'flex',
    gap: '0.5rem'
  },
  dot: {
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '9999px',
  },
  redDot: {
    backgroundColor: '#EF4444'
  },
  yellowDot: {
    backgroundColor: '#F59E0B'
  },
  greenDot: {
    backgroundColor: '#10B981'
  },
  terminalTitle: {
    marginLeft: '1rem',
    fontSize: '0.875rem'
  },
  logsContainer: {
    overflowY: 'auto',
    maxHeight: '24rem',
    display: 'flex',
    flexDirection: 'column-reverse'
  },
  logEntry: {
    paddingTop: '0.25rem',
    paddingBottom: '0.25rem',
    borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
  },
  rootText: {
    color: '#6EE7B7'
  },
  separator: {
    color: 'white'
  },
  pathText: {
    color: '#60A5FA'
  },
  logText: {
    color: '#34D399'
  }
};

const TerminalLogs: React.FC<TerminalLogsProps> = ({ logs }) => {
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.dotsContainer}>
          <div style={{...styles.dot, ...styles.redDot}}></div>
          <div style={{...styles.dot, ...styles.yellowDot}}></div>
          <div style={{...styles.dot, ...styles.greenDot}}></div>
        </div>
        <span style={styles.terminalTitle}>PMT Analytics Terminal</span>
      </div>
      <div 
        ref={logsContainerRef}
        style={styles.logsContainer}
      >
        {[...logs].reverse().map((log, index) => (
          <div 
            key={index}
            style={styles.logEntry}
          >
            <span style={styles.rootText}>root@pmt-analytics</span>
            <span style={styles.separator}>:</span>
            <span style={styles.pathText}>~</span>
            <span style={styles.separator}>$ </span>
            <span style={styles.logText}>{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalLogs;