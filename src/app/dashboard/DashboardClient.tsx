'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabaseClient';

interface Decision {
    id: string;
    title: string;
    context: string;
    reasoning: string;
    confidence: number;
    created_at: string;
    status: string;
    outcome?: {
        result: string;
        lessons_learned: string;
    };
}

// --- Sub-components (isolated for performance) ---

const DecisionItem = memo(({ decision, expanded, onToggle, onReviewSubmit, onDelete, isOnline }: {
    decision: Decision;
    expanded: boolean;
    onToggle: (id: string) => void;
    onReviewSubmit: (id: string, result: string, notes: string) => Promise<void>;
    onDelete: (e: React.MouseEvent, id: string) => void;
    isOnline: boolean;
}) => {
    const [reviewing, setReviewing] = useState(false);
    const [reviewResult, setReviewResult] = useState<'good' | 'bad' | 'mixed'>('good');
    const [reviewNotes, setReviewNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleLocalReview = async () => {
        setSubmitting(true);
        try {
            await onReviewSubmit(decision.id, reviewResult, reviewNotes);
            setReviewing(false);
            setReviewNotes('');
        } catch (err: any) {
            if (err.details) setErrors(err.details);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="glass-card decision-item"
            onClick={() => onToggle(decision.id)}
        >
            <div className="decision-header">
                <div className="decision-top-row">
                    <div className="decision-title-text">{decision.title}</div>
                    <div className="badges">
                        <div className="confidence-indicator">
                            <span className="confidence-text">Confidence: {decision.confidence} / 5</span>
                            <div className="confidence-bar-bg">
                                <div
                                    className="confidence-bar-fill"
                                    style={{ width: `${(decision.confidence / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                        {decision.outcome ? (
                            <span className={`badge badge-outcome-${decision.outcome.result}`}>
                                {decision.outcome.result}
                            </span>
                        ) : (
                            <span className={`badge badge-status-pending`}>
                                Pending
                            </span>
                        )}
                    </div>
                </div>
                <div className="decision-date">
                    {new Date(decision.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                    })}
                </div>
            </div>

            {expanded && (
                <div className="decision-expanded" onClick={(e) => e.stopPropagation()}>
                    <div className="expanded-section">
                        <span className="expanded-label">Context</span>
                        <p className="expanded-content">{decision.context}</p>
                    </div>

                    <div className="expanded-section">
                        <span className="expanded-label">Reasoning</span>
                        <p className="expanded-content">{decision.reasoning}</p>
                    </div>

                    {decision.outcome ? (
                        <div className="expanded-section">
                            <span className="expanded-label">Outcome Notes</span>
                            <p className="expanded-content outcome-notes-text">{decision.outcome.lessons_learned}</p>
                            <div className="locked-meta">
                                <span>🔒</span> Reasoning locked on {new Date(decision.created_at).toLocaleDateString()}.
                            </div>
                        </div>
                    ) : reviewing ? (
                        <div className="inline-review-form">
                            <div className="form-group">
                                <label>How did it turn out?</label>
                                <select
                                    value={reviewResult}
                                    onChange={(e) => setReviewResult(e.target.value as any)}
                                >
                                    <option value="good">Good</option>
                                    <option value="bad">Bad</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Lessons Learned</label>
                                <textarea
                                    placeholder="What would you do differently next time?"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    className={errors.lessons_learned ? 'input-invalid' : ''}
                                />
                                {errors.lessons_learned && (
                                    <span className="field-error">{errors.lessons_learned}</span>
                                )}
                            </div>
                            <div className="review-actions">
                                <button
                                    className="btn btn-primary"
                                    disabled={submitting || reviewNotes.length < 10}
                                    onClick={handleLocalReview}
                                >
                                    {submitting ? 'Saving...' : 'Save Result'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setReviewing(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card-actions">
                            <button
                                className="btn review-btn"
                                onClick={() => setReviewing(true)}
                            >
                                Review Outcome
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={(e) => onDelete(e, decision.id)}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

DecisionItem.displayName = 'DecisionItem';

const DecisionForm = memo(({ onSubmit, isOnline, submitting, fieldErrors }: {
    onSubmit: (data: any) => Promise<boolean>;
    isOnline: boolean;
    submitting: boolean;
    fieldErrors: Record<string, string>;
}) => {
    const [title, setTitle] = useState('');
    const [reasoning, setReasoning] = useState('');
    const [context, setContext] = useState('');
    const [confidence, setConfidence] = useState(3);

    useEffect(() => {
        const savedDraft = localStorage.getItem('decision_draft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setTitle(draft.title || '');
                setReasoning(draft.reasoning || '');
                setContext(draft.context || '');
                setConfidence(draft.confidence || 3);
            } catch (e) {
                localStorage.removeItem('decision_draft');
            }
        }
    }, []);

    useEffect(() => {
        if (title || reasoning || context) {
            localStorage.setItem('decision_draft', JSON.stringify({ title, reasoning, context, confidence }));
        }
    }, [title, reasoning, context, confidence]);

    const handleInternalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onSubmit({ title, reasoning, context, confidence });
        if (success) {
            setTitle('');
            setReasoning('');
            setContext('');
            setConfidence(3);
            localStorage.removeItem('decision_draft');
        }
    };

    return (
        <section className="capture-section">
            <h2>New Decision</h2>
            <div className="glass-card">
                <form onSubmit={handleInternalSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Decision Title</label>
                        <input
                            id="title"
                            type="text"
                            className={fieldErrors.title ? 'input-invalid' : ''}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={submitting || !isOnline}
                        />
                        {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="context">Context</label>
                        <textarea
                            id="context"
                            className={fieldErrors.context ? 'input-invalid' : ''}
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            disabled={submitting || !isOnline}
                        />
                        {fieldErrors.context && <span className="field-error">{fieldErrors.context}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reasoning">Reasoning & Assumptions</label>
                        <textarea
                            id="reasoning"
                            className={`reasoning-textarea ${fieldErrors.reasoning ? 'input-invalid' : ''}`}
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            required
                            disabled={submitting || !isOnline}
                        />
                        {fieldErrors.reasoning && <span className="field-error">{fieldErrors.reasoning}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confidence">Level of Confidence</label>
                        <select
                            id="confidence"
                            value={confidence}
                            className={fieldErrors.confidence ? 'input-invalid' : ''}
                            onChange={(e) => setConfidence(Number(e.target.value))}
                            disabled={submitting || !isOnline}
                        >
                            <option value={1}>1 / 5 - Low</option>
                            <option value={2}>2 / 5 - Moderate</option>
                            <option value={3}>3 / 5 - Certain</option>
                            <option value={4}>4 / 5 - High</option>
                            <option value={5}>5 / 5 - Absolute</option>
                        </select>
                        {fieldErrors.confidence && <span className="field-error">{fieldErrors.confidence}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting || !isOnline || !title || !reasoning}>
                        {submitting ? (
                            <>
                                <div className="loading-spinner" />
                                Locking Reasoning...
                            </>
                        ) : (
                            'Save Decision'
                        )}
                    </button>
                </form>
            </div>
        </section>
    );
});

DecisionForm.displayName = 'DecisionForm';

// --- Main Client Component ---

export default function DashboardClient({ initialDecisions }: { initialDecisions: any[] }) {
    const [decisions, setDecisions] = useState(initialDecisions);
    const [isOnline, setIsOnline] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        setIsOnline(navigator.onLine);
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    const fetchDecisions = useCallback(async () => {
        try {
            const response = await fetch('/api/decisions');
            if (response.ok) {
                const data = await response.json();
                setDecisions(data);
            }
        } catch (err) {
            // Background refresh fail is silent
        }
    }, []);

    const handleCreateDecision = async (formData: any) => {
        if (!isOnline) {
            setStatus({ type: 'error', message: 'You are currently offline. Changes are saved locally.' });
            return false;
        }

        setSubmitting(true);
        setStatus(null);
        setFieldErrors({});

        const payload = {
            ...formData,
            options: [
                { id: uuidv4(), text: 'Option A', rationale: 'Default option.' },
                { id: uuidv4(), text: 'Option B', rationale: 'Alternative option.' }
            ],
            chosen_option_id: uuidv4(),
            prediction: 'Outcome depends on reasoning.',
            review_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            tags: []
        };

        try {
            const response = await fetch('/api/decisions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 400 && result.details) {
                    setFieldErrors(result.details);
                }
                throw new Error(result.error || 'Issue saving decision.');
            }

            setStatus({ type: 'success', message: 'Decision captured.' });
            fetchDecisions();
            return true;
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const handleReviewSubmit = async (decisionId: string, result: string, notes: string) => {
        const response = await fetch('/api/outcomes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                decision_id: decisionId,
                result,
                lessons_learned: notes,
                impact_score: 3,
                was_correct_choice: result === 'good'
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw errorData;
        }

        fetchDecisions();
    };

    const handleDelete = async (e: React.MouseEvent, decisionId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this decision?')) return;

        try {
            const response = await fetch(`/api/decisions/${decisionId}`, { method: 'DELETE' });
            if (response.ok) {
                fetchDecisions();
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Delete failed.' });
        }
    };

    const toggleExpand = useCallback((id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
    }, []);

    return (
        <>
            {!isOnline && (
                <div className="offline-banner">
                    <span className="offline-icon">⚠️</span>
                    You are offline. Your progress is being saved locally.
                </div>
            )}

            {status && (
                <div className={status.type === 'success' ? 'success-message' : 'error-message'}>
                    {status.message}
                </div>
            )}

            <DecisionForm
                onSubmit={handleCreateDecision}
                isOnline={isOnline}
                submitting={submitting}
                fieldErrors={fieldErrors}
            />

            <section className="history-section">
                <h2 className="history-title">History</h2>
                <div className="decision-list">
                    {decisions.length === 0 ? (
                        <div className="glass-card empty-history">
                            You have not logged any decisions yet.
                        </div>
                    ) : (
                        decisions.map((decision) => (
                            <DecisionItem
                                key={decision.id}
                                decision={decision}
                                expanded={expandedId === decision.id}
                                onToggle={toggleExpand}
                                onReviewSubmit={handleReviewSubmit}
                                onDelete={handleDelete}
                                isOnline={isOnline}
                            />
                        ))
                    )}
                </div>
            </section>
        </>
    );
}
