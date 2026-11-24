import React from 'react';
import { RubricCriteria, SkillRequirement } from '../../types';
import { Plus, Trash2, Sliders } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export interface JobRubricBuilderProps {
  skills: SkillRequirement[];
  onSkillsChange: (skills: SkillRequirement[]) => void;
  rubrics: RubricCriteria[];
  onRubricsChange: (rubrics: RubricCriteria[]) => void;
}

export const JobRubricBuilder: React.FC<JobRubricBuilderProps> = ({
  skills,
  onSkillsChange,
  rubrics,
  onRubricsChange,
}) => {
  // Skill handlers
  const addSkill = () => {
    onSkillsChange([...skills, { name: '', weight: 1.0, required: true }]);
  };

  const updateSkill = (index: number, updated: Partial<SkillRequirement>) => {
    const next = [...skills];
    next[index] = { ...next[index], ...updated };
    onSkillsChange(next);
  };

  const removeSkill = (index: number) => {
    onSkillsChange(skills.filter((_, i) => i !== index));
  };

  // Rubric handlers
  const addRubric = () => {
    onRubricsChange([...rubrics, { category: '', weight: 0.25, description: '' }]);
  };

  const updateRubric = (index: number, updated: Partial<RubricCriteria>) => {
    const next = [...rubrics];
    next[index] = { ...next[index], ...updated };
    onRubricsChange(next);
  };

  const removeRubric = (index: number) => {
    onRubricsChange(rubrics.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      {/* 1. Technical Skills Matrix */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Required Technical Competencies</h4>
            <p className="text-xs text-surface-400 mt-0.5">
              Specify skills with weighted multiplier (0.1 = optional, 1.0 = mandatory core)
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addSkill} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Skill
          </Button>
        </div>

        <div className="space-y-3">
          {skills.map((skill, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-surface-950 p-3 rounded-xl border border-surface-800">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Skill name (e.g. Kubernetes, Python, React)"
                  value={skill.name}
                  onChange={(e) => updateSkill(idx, { name: e.target.value })}
                  className="w-full bg-surface-900 border border-surface-800 rounded-lg px-3 py-2 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="w-48 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={skill.weight}
                  onChange={(e) => updateSkill(idx, { weight: parseFloat(e.target.value) })}
                  className="w-full accent-brand-500"
                />
                <span className="font-mono text-xs text-surface-300 w-8 text-right">{skill.weight}x</span>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-surface-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skill.required}
                  onChange={(e) => updateSkill(idx, { required: e.target.checked })}
                  className="rounded border-surface-700 bg-surface-900 text-brand-500 focus:ring-brand-500"
                />
                <span>Mandatory</span>
              </label>

              <button
                type="button"
                onClick={() => removeSkill(idx)}
                className="p-1.5 text-surface-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {skills.length === 0 && (
            <p className="text-xs text-surface-500 italic">No skills added yet. Click 'Add Skill' above.</p>
          )}
        </div>
      </div>

      {/* 2. Agent Rubric Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Agent Evaluation Rubrics</h4>
            <p className="text-xs text-surface-400 mt-0.5">
              Categories evaluated by the Criteria Matching Agent (weights should sum to 1.0)
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addRubric} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Rubric Dimension
          </Button>
        </div>

        <div className="space-y-3">
          {rubrics.map((rubric, idx) => (
            <div key={idx} className="bg-surface-950 p-4 rounded-xl border border-surface-800 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Category Name (e.g. System Design, Concurrency)"
                  value={rubric.category}
                  onChange={(e) => updateRubric(idx, { category: e.target.value })}
                  className="flex-1 bg-surface-900 border border-surface-800 rounded-lg px-3 py-2 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
                />

                <div className="w-48 flex items-center gap-2">
                  <span className="text-[11px] text-surface-400">Weight:</span>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={rubric.weight}
                    onChange={(e) => updateRubric(idx, { weight: parseFloat(e.target.value) })}
                    className="w-full accent-brand-500"
                  />
                  <span className="font-mono text-xs text-surface-300 w-10 text-right">
                    {(rubric.weight * 100).toFixed(0)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeRubric(idx)}
                  className="p-1.5 text-surface-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Evaluation guidance prompt for AI agents (e.g. Verify hands-on experience in microservices)"
                value={rubric.description}
                onChange={(e) => updateRubric(idx, { description: e.target.value })}
                className="w-full bg-surface-900 border border-surface-800 rounded-lg px-3 py-2 text-xs text-surface-300 placeholder-surface-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          ))}

          {rubrics.length === 0 && (
            <p className="text-xs text-surface-500 italic">No custom rubrics added. Default rubrics will be applied.</p>
          )}
        </div>
      </div>
    </div>
  );
};
