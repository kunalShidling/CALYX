import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ParsedResume } from '../types';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Upload,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Sparkles,
  FileCode,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

export const CandidateResumesPage: React.FC = () => {
  const [resumes, setResumes] = useState<ParsedResume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [rawFileName, setRawFileName] = useState('resume.txt');

  const { success, error } = useToast();

  const loadResumes = async () => {
    setIsLoading(true);
    try {
      const data = await api.resumes.getMyResumes();
      setResumes(data);
    } catch (err: any) {
      error('Failed to load resumes', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      error('File Too Large', 'Maximum resume file size is 10 MB.');
      return;
    }

    setIsUploading(true);
    try {
      const parsed = await api.resumes.uploadFile(file);
      success('Resume Indexed!', `Parsed ${parsed.skills.length} skills into 384-dim vector space.`);
      loadResumes();
    } catch (err: any) {
      error('Upload Failed', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRawTextUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      error('Empty Resume Text', 'Please provide resume text content to parse.');
      return;
    }

    setIsUploading(true);
    try {
      const parsed = await api.resumes.uploadText({
        text_content: rawText,
        file_name: rawFileName || 'resume.txt',
      });
      success('Text Resume Parsed!', `Detected ${parsed.skills.length} skills and ${parsed.experience_years} years exp.`);
      setIsTextModalOpen(false);
      setRawText('');
      loadResumes();
    } catch (err: any) {
      error('Parsing Failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Resume Intelligence Hub</h1>
          <p className="text-xs text-surface-400 mt-1">
            Upload resumes to compute 384-dimensional dense semantic vectors and structured entities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsTextModalOpen(true)}
            leftIcon={<FileCode className="w-3.5 h-3.5" />}
          >
            Paste Text
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isUploading}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => {}}
            >
              Upload Document (PDF / DOCX)
            </Button>
          </label>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="border-2 border-dashed border-surface-800 rounded-2xl p-8 bg-surface-900/30 text-center hover:border-brand-500/50 transition-colors">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-white">Upload Resume File for Semantic Vectorization</h4>
        <p className="text-xs text-surface-400 max-w-sm mx-auto mt-1 mb-4">
          Supported formats: PDF, DOCX, TXT (Max size: 10MB). Text is parsed into canonical competencies and high-dimensional embeddings.
        </p>
        <label className="cursor-pointer inline-block">
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <span className="text-xs font-semibold px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-white border border-surface-700 inline-flex items-center gap-2">
            Select File from Computer
          </span>
        </label>
      </div>

      {/* Resumes Listing */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Your Indexed Resumes ({resumes.length})</h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-36 bg-surface-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-6 h-6" />}
            title="No Resumes Indexed"
            description="You haven't uploaded any resumes yet. Upload a PDF or paste text to generate your semantic vector."
          />
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <Card key={resume.resume_id}>
                <CardBody className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-950 border border-surface-800 text-emerald-400 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-white">{resume.file_name}</h4>
                        <div className="flex items-center gap-3 text-xs text-surface-400 mt-0.5 flex-wrap">
                          <span className="font-mono text-emerald-400">ID: {resume.resume_id}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(resume.created_at).toLocaleDateString()}
                          </span>
                          <span>{resume.word_count} words</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="purple" size="sm">
                        384-DIM VECTOR EMBEDDED
                      </Badge>
                    </div>
                  </div>

                  {/* Candidate Extracted Bio Data */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-950 border border-surface-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-surface-400 block uppercase font-mono">Candidate Name</span>
                      <span className="font-semibold text-white mt-0.5 block">{resume.candidate_name || 'Detected in Parse'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-surface-400 block uppercase font-mono">Estimated Experience</span>
                      <span className="font-semibold text-white mt-0.5 block flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-brand-400" />
                        {resume.experience_years} years
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-surface-400 block uppercase font-mono">Academic Degrees</span>
                      <span className="font-semibold text-white mt-0.5 block truncate flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                        {resume.education && resume.education.length > 0 ? resume.education[0] : 'None detected'}
                      </span>
                    </div>
                  </div>

                  {/* Skills Pill Cloud */}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 block mb-2">
                      Detected Technical Competencies ({resume.skills.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-md bg-surface-950 border border-surface-800 text-surface-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Raw Text Upload Modal */}
      <Modal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        title="Direct Text Ingestion"
        description="Paste raw resume or LinkedIn text content to extract skills and vector embeddings"
        maxWidth="lg"
      >
        <form onSubmit={handleRawTextUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5">
              Document Label / Filename
            </label>
            <input
              type="text"
              value={rawFileName}
              onChange={(e) => setRawFileName(e.target.value)}
              placeholder="e.g. alex_mercer_resume.txt"
              className="w-full bg-surface-950 border border-surface-800 rounded-lg px-3 py-2 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-surface-300 mb-1.5">
              Resume Text Content
            </label>
            <textarea
              rows={10}
              placeholder="Paste complete resume text here including work experience, technical skills, and education..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-xs text-white font-mono placeholder-surface-500 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsTextModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUploading}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Parse & Generate Embeddings
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
