'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Payment {
  id: string
  created_at: string
  valor: number
  metodo: string
  status: string
  receipt_number?: string
  categoria?: string | null
  client_tags?: string[]
  descricao?: string | null
  motorista?: { nome?: string } | null
}

const CATEGORIAS = ['Negócio', 'Pessoal', 'Viagem', 'Alimentação', 'Transporte', 'Saúde', 'Outro']

const METHOD_LABEL: Record<string, string> = {
  card: 'Cartão', pix: 'Pix', apple_pay: 'Apple Pay', google_pay: 'Google Pay',
}

const STATUS_STYLE: Record<string, { text: string; cls: string }> = {
  succeeded: { text: 'Pago', cls: 'text-green-700 bg-green-100' },
  pending: { text: 'Pendente', cls: 'text-yellow-700 bg-yellow-100' },
  failed: { text: 'Falhou', cls: 'text-red-700 bg-red-100' },
  refunded: { text: 'Reembolsado', cls: 'text-blue-700 bg-blue-100' },
}

const fmt = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default function HistoricoPage() {
  const { status } = useSession()
  const router = useRouter()
  const tagInputRef = useRef<HTMLInputElement>(null)

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')

  // Detail panel
  const [selected, setSelected] = useState<Payment | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Editing state inside panel
  const [editCategoria, setEditCategoria] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Extract
  const [extracting, setExtracting] = useState(false)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const sp = new URLSearchParams()
      if (startDate) sp.set('startDate', startDate)
      if (endDate) sp.set('endDate', endDate)
      if (search) sp.set('search', search)
      if (filterTag) sp.set('tag', filterTag)
      const res = await fetch(`/api/client/payments${sp.toString() ? `?${sp}` : ''}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPayments(data.payments || [])
    } catch {
      setError('Erro ao carregar histórico.')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, search, filterTag])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (status === 'authenticated') fetchPayments()
  }, [fetchPayments, router, status])

  const openPanel = (payment: Payment) => {
    setSelected(payment)
    setEditCategoria(payment.categoria || '')
    setEditTags(payment.client_tags || [])
    setTagInput('')
    setSaveMsg('')
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    setTimeout(() => setSelected(null), 300)
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !editTags.includes(t)) setEditTags(prev => [...prev, t])
    setTagInput('')
    tagInputRef.current?.focus()
  }

  const removeTag = (t: string) => setEditTags(prev => prev.filter(x => x !== t))

  const saveAnnotations = async () => {
    if (!selected) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/client/payments/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: editCategoria || null, client_tags: editTags }),
      })
      if (!res.ok) throw new Error()
      setSaveMsg('Salvo!')
      setPayments(prev =>
        prev.map(p =>
          p.id === selected.id
            ? { ...p, categoria: editCategoria || null, client_tags: editTags }
            : p
        )
      )
      setSelected(prev => prev ? { ...prev, categoria: editCategoria || null, client_tags: editTags } : prev)
      setTimeout(() => setSaveMsg(''), 2000)
    } catch {
      setSaveMsg('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleExtract = () => {
    setExtracting(true)
    const sp = new URLSearchParams()
    if (startDate) sp.set('startDate', startDate)
    if (endDate) sp.set('endDate', endDate)
    if (filterTag) sp.set('tag', filterTag)
    // Pass visible payment IDs
    sp.set('ids', payments.map(p => p.id).join(','))
    window.open(`/api/client/receipts/bulk?${sp}`, '_blank')
    setTimeout(() => setExtracting(false), 1000)
  }

  // Collect all unique tags from loaded payments for filter suggestions
  const allTags = Array.from(new Set(payments.flatMap(p => p.client_tags || [])))

  const statusInfo = (s: string) => STATUS_STYLE[s] || { text: s, cls: 'text-gray-700 bg-gray-100' }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Histórico de Pagamentos</h1>
        <Link
          href="/cliente/dashboard/add-invoice"
          className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          Vincular Pagamento
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchPayments()}
            placeholder="Buscar por vendedor..."
            className="flex-1 min-w-[150px] text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
          />
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-400 outline-none"
          />
          <span className="text-gray-400 text-sm">até</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-400 outline-none"
          />
          <button
            onClick={fetchPayments}
            className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Filtrar
          </button>
        </div>

        {/* Tag filter + extract */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Tag:</span>
          <button
            onClick={() => setFilterTag('')}
            className={`text-xs px-3 py-1 rounded-full border transition ${
              !filterTag ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600 hover:border-purple-400'
            }`}
          >
            Todas
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                filterTag === tag ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600 hover:border-purple-400'
              }`}
            >
              {tag}
            </button>
          ))}

          <div className="ml-auto">
            <button
              onClick={handleExtract}
              disabled={extracting || payments.length === 0}
              className="flex items-center gap-2 text-sm bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition disabled:opacity-40 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {extracting ? 'Gerando...' : `Extrair PDFs (${payments.length})`}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
      )}

      {/* Payment list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Carregando pagamentos...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500 mb-2">Nenhum pagamento encontrado.</p>
          <Link href="/cliente/dashboard/add-invoice" className="text-sm text-purple-600 hover:underline">
            Vincular usando número da transação
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(payment => {
            const st = statusInfo(payment.status)
            const tags = payment.client_tags || []
            const motoristaNome = payment.motorista?.nome || 'Vendedor'
            return (
              <button
                key={payment.id}
                onClick={() => openPanel(payment)}
                className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-purple-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900">{motoristaNome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.text}</span>
                      {payment.categoria && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                          {payment.categoria}
                        </span>
                      )}
                      {tags.map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      {fmtDate(payment.created_at)}
                      {payment.metodo && (
                        <span className="ml-2">{METHOD_LABEL[payment.metodo] || payment.metodo}</span>
                      )}
                    </div>
                    {payment.receipt_number && (
                      <div className="text-xs text-gray-400 font-mono mt-0.5">Ref: {payment.receipt_number}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className="text-lg font-bold text-gray-900">{fmt(payment.valor)}</span>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail panel overlay */}
      {panelOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={closePanel}
        />
      )}

      {/* Detail slide panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          panelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selected && (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <p className="font-semibold text-gray-900 text-lg">{selected.motorista?.nome || 'Vendedor'}</p>
                <p className="text-sm text-gray-500">{fmtDate(selected.created_at)}</p>
              </div>
              <button onClick={closePanel} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Amount */}
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-700">{fmt(selected.valor)}</p>
                <p className="text-sm text-purple-500 mt-1">
                  {METHOD_LABEL[selected.metodo] || selected.metodo}
                  {' · '}
                  <span className={`font-medium ${statusInfo(selected.status).cls.split(' ')[0]}`}>
                    {statusInfo(selected.status).text}
                  </span>
                </p>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                {selected.receipt_number && (
                  <div className="flex justify-between py-2 border-b border-dashed border-gray-100">
                    <span className="text-gray-500">Referência</span>
                    <span className="font-mono text-gray-700">{selected.receipt_number}</span>
                  </div>
                )}
                {selected.descricao && (
                  <div className="flex justify-between py-2 border-b border-dashed border-gray-100">
                    <span className="text-gray-500">Descrição</span>
                    <span className="text-gray-700 text-right max-w-[60%]">{selected.descricao}</span>
                  </div>
                )}
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditCategoria('')}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      !editCategoria ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600 hover:border-purple-400'
                    }`}
                  >
                    Nenhuma
                  </button>
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setEditCategoria(editCategoria === cat ? '' : cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${
                        editCategoria === cat ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600 hover:border-purple-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editTags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                      #{t}
                      <button onClick={() => removeTag(t)} className="ml-0.5 text-indigo-400 hover:text-indigo-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder="Adicionar tag..."
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                  <button
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Panel footer */}
            <div className="p-5 border-t border-gray-100 space-y-2">
              {saveMsg && (
                <p className={`text-sm text-center font-medium ${saveMsg === 'Salvo!' ? 'text-green-600' : 'text-red-600'}`}>
                  {saveMsg}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={saveAnnotations}
                  disabled={saving}
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Salvando...' : 'Salvar anotações'}
                </button>
                <button
                  onClick={() => {
                    const sp = new URLSearchParams({ ids: selected.id })
                    window.open(`/api/client/receipts/bulk?${sp}`, '_blank')
                  }}
                  className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                  title="Baixar comprovante"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  PDF
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
