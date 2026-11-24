import React, { useState } from 'react';
import { api } from '../api/client';
import { CandidateMatchItem } from '../types';
import { useToast } from '../context/ToastContext';
import { Search, Sparkles, Filter, Cpu, Sliders, Database, UserCheck } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { VectorMatchCard } from '../components/domain/VectorMatchCard';
import { EmptyState } from '../components/common/EmptyState';

export const RecruiterVectorSearchPage: React.FC = () => {
  const [jobDescription, setJobDescription] = useState(
    'Seeking a Senior Cloud and Distributed Systems Engineer with deep expertise in Kubernetes cluster management, Docker containerization, Python FastAPI microservices, and Horizontal Pod Autoscaler (HPA) tuning.'
  );
  const [skillsInput, setSkillsInput] = useState('Kubernetes, Python, Docker, FastAPI');
  const [minExp, setMinExp] = useState(3);
  const [topK, setTopK] = useState(5);
  const [matches, setMatches] = useState<CandidateMatchItem[]>([]);
  const [totalIndexed, setTotalIndexed] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { success, error } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      error('Description Required', 'Please provide a job description or skill query to vectorize.');
      return;
    }

    const requiredSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSearching(true);
    try {
      const data = await api.resumes.search({
        job_description: jobDescription,
        required_skills: requiredSkills,
        min_experience_years: Number(minExp),
        top_k: Number(topK),
      });

      setMatches(data.top_matches);
      setTotalIndexed(data.total_candidates_indexed);
      success('Vector Search Complete', `Ranked top ${data.top_matches.length} candidates from ${data.total_candidates_indexed} indexed vectors.`);
    } catch (err: any) {
      error('Vector Search Failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Database className="w-4 h-4 text-sky-400" />
          <span className="font-mono text-xs font-bold text-sky-400 uppercase tracking-widest">
            384-Dimensional High-Performance Vector Space
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Candidate Semantic Vector Search</h1>
        <p className="text-xs text-surface-400 mt-1">
          Perform Approximate Nearest Neighbor (ANN) Cosine Similarity searches across the candidate vector database
        </p>
      </div>

      {/* Query Builder Form */}
      <Card>
        <CardBody className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5">
                Job Description / Requisition Requirements (Text to Vectorize)
              </label>
              <textarea
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste paragraph of technical qualifications, cloud architecture scope, and domain knowledge..."
                className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 font-mono leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Required Skills (Comma-separated)"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="Kubernetes, Python, Docker, Go, Redis"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Min Exp (Yrs)"
                  type="number"
                  min={0}
                  max={25}
                  value={minExp}
                  onChange={(e) => setMinExp(Number(e.target.value))}
                />

                <Input
                  label="Top K"
                  type="number"
                  min={1}
                  max={25}
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-surface-400">
                Computes Dot Product of unit-normalized 384-dim dense vectors
              </span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSearching}
                leftIcon={<Sparkles className="w-4 h-4 text-brand-300" />}
              >
                Execute Vector Search
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Results Header */}
      {totalIndexed !== null && (
        <div className="flex items-center justify-between text-xs text-surface-400 px-1">
          <span>
            Ranked {matches.length} candidate(s) from a pool of {totalIndexed} indexed vector embeddings
          </span>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {matches.map((item, index) => (
          <VectorMatchCard key={item.resume_id} match={item} rank={index + 1} />
        ))}

        {!isSearching && matches.length === 0 && totalIndexed !== null && (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title="No Vector Matches Found"
            description="No candidates met the minimum similarity or experience threshold. Try widening your criteria."
          />
        )}
      </div>
    </div>
  );
};
