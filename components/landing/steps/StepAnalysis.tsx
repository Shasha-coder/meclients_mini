'use client'
import { useEffect, useState } from 'react'
import { Check, X, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import { W } from './shared'

interface AnalysisItem {
  field: string
  label: string
  status: 'found' | 'missing' | 'partial'
  value?: string
  suggestion?: string
}

interface AnalysisResult {
  items: AnalysisItem[]
  summary: string
  ready: boolean
}

export default function StepAnalysis({ 
  nextStep, 
  prevStep,
  agentSay, 
  scrapedData,
  setScrapedData,
}: any) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  useEffect(() => {
    runAnalysis()
  }, [])

  async function runAnalysis() {
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scrapedData, 
          source: scrapedData?.isFile ? 'pdf' : 'website' 
        }),
      })
      const data = await res.json()
      setAnalysis(data)
      
      // Initialize edit values
      const values: Record<string, string> = {}
      data.items?.forEach((item: AnalysisItem) => {
        values[item.field] = item.value || ''
      })
      setEditValues(values)
      
      // Send conversational message
      if (data.summary) {
        agentSay(data.summary)
      }
    } catch (e) {
      agentSay("I had trouble analyzing your data. Let's continue and fill in the details manually.")
      setAnalysis({
        items: [
          { field: 'name', label: 'Business Name', status: 'missing', suggestion: 'Enter your business name' },
          { field: 'industry', label: 'Industry Type', status: 'missing', suggestion: 'Select your industry' },
          { field: 'services', label: 'Services', status: 'missing', suggestion: 'List your main services' },
          { field: 'hours', label: 'Hours', status: 'missing', suggestion: 'Add business hours' },
          { field: 'phone', label: 'Phone', status: 'missing', suggestion: 'Add contact number' },
          { field: 'address', label: 'Address', status: 'missing', suggestion: 'Add location' },
        ],
        summary: '',
        ready: false,
      })
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(field: string) {
    setEditingField(field)
  }

  function handleSave(field: string) {
    // Update scraped data with the new value
    setScrapedData((prev: any) => ({
      ...prev,
      [field]: editValues[field],
    }))
    
    // Update analysis item status
    setAnalysis(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map(item => 
          item.field === field 
            ? { ...item, status: editValues[field] ? 'found' : 'missing', value: editValues[field] }
            : item
        ),
      }
    })
    setEditingField(null)
  }

  function handleContinue() {
    // Merge edit values into scraped data
    const updatedData = { ...scrapedData }
    Object.entries(editValues).forEach(([key, value]) => {
      if (value) updatedData[key] = value
    })
    setScrapedData(updatedData)
    nextStep(null, 'Data verified')
  }

  const foundCount = analysis?.items?.filter(i => i.status === 'found').length || 0
  const totalCount = analysis?.items?.length || 0
  const canContinue = foundCount >= 2 // At least name + 1 other field

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '40px 20px' }}>
        <div style={{ 
          width: 56, 
          height: 56, 
          borderRadius: 16, 
          background: 'linear-gradient(135deg, #2eb87a 0%, #22c55e 100%)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          <Loader2 size={28} color="white" className="animate-spin" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1a7a4a', margin: '0 0 4px' }}>Analyzing your data...</p>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Checking what info we have for your agent</p>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Progress header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: foundCount === totalCount ? '#f0fdf4' : '#fefce8',
        borderRadius: 12,
        border: `1px solid ${foundCount === totalCount ? '#bbf7d0' : '#fef08a'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {foundCount === totalCount ? (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={16} color="white" strokeWidth={3} />
            </div>
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} color="white" />
            </div>
          )}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: foundCount === totalCount ? '#166534' : '#854d0e', margin: 0 }}>
              {foundCount === totalCount ? 'All data found!' : `${foundCount} of ${totalCount} fields found`}
            </p>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
              {foundCount === totalCount ? 'Ready to continue' : 'Fill in missing fields below'}
            </p>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {analysis?.items?.map((item) => (
          <div 
            key={item.field}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              padding: '10px 14px',
              background: item.status === 'found' ? '#f8fafc' : '#fefce8',
              borderRadius: 10,
              border: `1px solid ${item.status === 'found' ? '#e2e8f0' : '#fef08a'}`,
              transition: 'all 0.2s ease',
            }}
          >
            {/* Status icon */}
            <div style={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              background: item.status === 'found' ? '#22c55e' : item.status === 'partial' ? '#f59e0b' : '#e2e8f0',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {item.status === 'found' ? (
                <Check size={14} color="white" strokeWidth={3} />
              ) : item.status === 'partial' ? (
                <AlertCircle size={14} color="white" />
              ) : (
                <X size={12} color="#94a3b8" strokeWidth={3} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#334155', margin: 0 }}>{item.label}</p>
              {editingField === item.field ? (
                <input
                  type="text"
                  value={editValues[item.field] || ''}
                  onChange={e => setEditValues(prev => ({ ...prev, [item.field]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleSave(item.field)}
                  onBlur={() => handleSave(item.field)}
                  autoFocus
                  placeholder={item.suggestion}
                  style={{
                    width: '100%',
                    fontSize: 12,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #2eb87a',
                    outline: 'none',
                    marginTop: 4,
                  }}
                />
              ) : (
                <p style={{ 
                  fontSize: 12, 
                  color: item.status === 'found' ? '#64748b' : '#94a3b8', 
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.value || item.suggestion}
                </p>
              )}
            </div>

            {/* Edit button */}
            {editingField !== item.field && (
              <button
                onClick={() => handleEdit(item.field)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: item.status !== 'found' ? '#2eb87a' : 'transparent',
                  color: item.status !== 'found' ? 'white' : '#64748b',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {item.status !== 'found' ? 'Add' : 'Edit'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button onClick={prevStep} style={W.backBtn}>
          Back
        </button>
        <button 
          onClick={handleContinue}
          disabled={!canContinue}
          style={{ 
            ...W.gbtn(true), 
            flex: 1,
            padding: '14px 20px',
            borderRadius: 12,
            background: canContinue ? '#2eb87a' : '#cbd5e1',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          Continue
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
