import React, { useEffect, useState } from 'react';
import Radar from './Radar';
import FuzzyText from './FuzzyText';
import './IntroPage.css';

const FEATURES = [
  'Kernel Pipeline',
  'Live ACL Editor',
  'Attack Scenarios',
  'Threat Monitor',
  'Audit Logging',
  'IDS Detection',
];

const KEYWORDS = [
  { text: 'Authentication', color: '#8b5cf6' },
  { text: 'ACL Policies', color: '#06b6d4' },
  { text: 'Intrusion Detection', color: '#f59e0b' },
  { text: 'Quarantine', color: '#ef4444' },
];

export default function IntroPage({ onEnter }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut: Enter to start
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter') handleStart();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleStart = () => {
    setLeaving(true);
    setTimeout(() => onEnter(), 600);
  };

  return (
    <div className={`intro-page ${visible ? 'intro-visible' : ''} ${leaving ? 'intro-leaving' : ''}`}>
      
      {/* Radar WebGL Background */}
      <div className="intro-radar-bg">
        <Radar
          speed={0.6}
          scale={0.5}
          ringCount={10}
          spokeCount={12}
          ringThickness={0.04}
          spokeThickness={0.008}
          sweepSpeed={0.8}
          sweepWidth={3.0}
          sweepLobes={1}
          color="#7c3aed"
          backgroundColor="#060a13"
          falloff={1.5}
          brightness={0.8}
          enableMouseInteraction={true}
          mouseInfluence={0.15}
        />
      </div>

      {/* Dark vignette overlay to keep text readable */}
      <div className="intro-vignette" />

      {/* Header */}
      <header className="intro-header">
        <div className="intro-header-left">
          <div className="intro-logo">
            <span className="intro-logo-icon">⚡</span>
          </div>
          <span className="intro-brand">SyscallShield</span>
          <span className="intro-version">v4.0</span>
        </div>
        <div className="intro-header-right">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="intro-header-link"
          >
            GitHub
          </a>
          <a href="#docs" className="intro-header-link">
            Docs
          </a>
        </div>
      </header>

      {/* Hero Content */}
      <main className="intro-hero">
        <div className="intro-hero-content">
          
          {/* FuzzyText Title Lines */}
          <h1 className="intro-title">
            <FuzzyText
              fontSize="clamp(1.4rem, 4.5vw, 3rem)"
              fontWeight={900}
              fontFamily="'Press Start 2P', monospace"
              color="#e2e8f0"
              enableHover={true}
              baseIntensity={0.12}
              hoverIntensity={0.45}
              fuzzRange={20}
              className="intro-fuzzy-line"
            >
              System Call
            </FuzzyText>

            <FuzzyText
              fontSize="clamp(1.4rem, 4.5vw, 3rem)"
              fontWeight={900}
              fontFamily="'Press Start 2P', monospace"
              color="#e2e8f0"
              enableHover={true}
              baseIntensity={0.12}
              hoverIntensity={0.45}
              fuzzRange={20}
              className="intro-fuzzy-line"
            >
              Interface for
            </FuzzyText>

            <FuzzyText
              fontSize="clamp(1.4rem, 4.5vw, 3rem)"
              fontWeight={900}
              fontFamily="'Press Start 2P', monospace"
              color="#e2e8f0"
              enableHover={true}
              baseIntensity={0.12}
              hoverIntensity={0.45}
              fuzzRange={20}
              className="intro-fuzzy-line"
            >
              Enhanced
            </FuzzyText>

            <FuzzyText
              fontSize="clamp(1.6rem, 5vw, 3.4rem)"
              fontWeight={900}
              fontFamily="'Press Start 2P', monospace"
              color="#a78bfa"
              enableHover={true}
              baseIntensity={0.15}
              hoverIntensity={0.55}
              fuzzRange={25}
              gradient={['#a78bfa', '#8b5cf6', '#7c3aed']}
              className="intro-fuzzy-line intro-fuzzy-accent"
            >
              Security
            </FuzzyText>
          </h1>

          <p className="intro-description">
            Explore how your operating system enforces security in real-time. Visualise{' '}
            {KEYWORDS.map((kw, i) => (
              <React.Fragment key={kw.text}>
                <span className="intro-keyword" style={{ color: kw.color }}>
                  {kw.text}
                </span>
                {i < KEYWORDS.length - 1 && (i === KEYWORDS.length - 2 ? ', and ' : ', ')}
              </React.Fragment>
            ))}{' '}
            mechanisms with stunning animations, kernel pipeline simulation, and intrusion
            detection — all in one interactive tool.
          </p>

          {/* Feature Tags */}
          <div className="intro-tags">
            {FEATURES.map((feat) => (
              <span key={feat} className="intro-tag">
                {feat}
              </span>
            ))}
          </div>

          {/* CTA Button */}
          <button className="intro-cta" onClick={handleStart} id="start-simulation-btn">
            <span className="intro-cta-icon">▶</span>
            Start Simulation
          </button>

          {/* Keyboard hint */}
          <p className="intro-hint">
            Press <kbd>Enter</kbd> to begin
          </p>
        </div>
      </main>
    </div>
  );
}
