import React from 'react';

const STAGES = [
  { key: 'init',  name: 'INIT',  desc: 'Process Lookup' },
  { key: 'authn', name: 'AUTHN', desc: 'Authentication' },
  { key: 'acl',   name: 'ACL',   desc: 'Permission Gate' },
  { key: 'exec',  name: 'EXEC',  desc: 'Syscall Dispatch' },
];

/**
 * pipelineState shape:
 * {
 *   currentStage: 0-3 | null,
 *   stages: { init: 'idle'|'active'|'passed'|'failed', ... },
 *   details: { init: 'text', authn: 'text', ... },
 * }
 */
export default function KernelPipeline({ pipelineState, stepMode, onContinue, onReset, isRunning, onStop }) {
  const { stages = {}, details = {} } = pipelineState || {};

  return (
    <div>
      <div className="section-label">Kernel Pipeline</div>
      <div className="pipeline">
        {STAGES.map((stage, i) => {
          const status = stages[stage.key] || 'idle';
          return (
            <React.Fragment key={stage.key}>
              {i > 0 && <div className="pipeline-arrow">→</div>}
              <div className={`pipeline-stage ${status}`}>
                <div className="pipeline-stage-name" style={{
                  color: status === 'active' ? 'var(--clr-info)' :
                         status === 'passed' ? 'var(--clr-success)' :
                         status === 'failed' ? 'var(--clr-danger)' :
                         'var(--clr-text-muted)'
                }}>
                  {stage.name}
                </div>
                <div className="pipeline-stage-detail">
                  {details[stage.key] || stage.desc}
                </div>
                {stepMode && status === 'active' && (
                  <button className="btn-continue" onClick={onContinue}>
                    Continue ▶
                  </button>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className="pipeline-reset-row">
        <button
          className="btn-reset-pipeline"
          onClick={onReset}
          title="Stop & reset the entire simulator"
        >
          <span className="reset-icon">↺</span> Reset Simulator
        </button>
      </div>
    </div>
  );
}
