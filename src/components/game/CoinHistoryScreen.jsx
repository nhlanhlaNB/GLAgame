import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { styles } from './gameStyles'
import { LoadingPage, Pill, SectionHeader } from './ui'
import { syncPlayerWallet } from '../../services/player/playerWalletService'

function CoinHistoryScreen({
  glaCoinBalance = 0,
  totalGlaCoinEarned = 0,
  glaCoinSpentOnHints = 0,
  coinTransactions = [],
  onBackToDashboard
}) {
  const { currentUser } = useAuth()
  const [walletData, setWalletData] = useState({
    transactions: [],
    summary: {
      glaCoinBalance,
      totalGlaCoinEarned,
      totalGlaCoinSpent: glaCoinSpentOnHints,
      transactionCount: 0,
      earnedCount: 0,
      spentCount: 0
    }
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [minimumAmount, setMinimumAmount] = useState('0')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadWallet() {
    setLoading(true)
    setError('')

    try {
      if (!currentUser?.uid) {
        setWalletData({
          transactions: coinTransactions,
          summary: {
            glaCoinBalance,
            totalGlaCoinEarned,
            totalGlaCoinSpent: glaCoinSpentOnHints,
            transactionCount: coinTransactions.length,
            earnedCount: coinTransactions.filter((transaction) => transaction.type === 'earned').length,
            spentCount: coinTransactions.filter((transaction) => transaction.type === 'spent').length
          }
        })
        return
      }

      const result = await syncPlayerWallet({
        userId: currentUser.uid,
        localTransactions: coinTransactions,
        glaCoinBalance,
        totalGlaCoinEarned,
        totalGlaCoinSpent: glaCoinSpentOnHints
      })

      setWalletData(result)
    } catch (err) {
      setError(err.message || 'Could not load GLA coin wallet from the system.')
      setWalletData({
        transactions: coinTransactions,
        summary: {
          glaCoinBalance,
          totalGlaCoinEarned,
          totalGlaCoinSpent: glaCoinSpentOnHints,
          transactionCount: coinTransactions.length,
          earnedCount: coinTransactions.filter((transaction) => transaction.type === 'earned').length,
          spentCount: coinTransactions.filter((transaction) => transaction.type === 'spent').length
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallet()
  }, [
    currentUser?.uid,
    coinTransactions,
    glaCoinBalance,
    totalGlaCoinEarned,
    glaCoinSpentOnHints
  ])

  const filteredTransactions = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase()
    const minAmount = Number(minimumAmount) || 0

    return walletData.transactions.filter((transaction) => {
      const searchableText = [
        transaction.type,
        transaction.reason,
        transaction.problemTitle,
        transaction.createdAtText
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch = !cleanSearch || searchableText.includes(cleanSearch)

      const matchesType =
        typeFilter === 'all' || String(transaction.type).toLowerCase() === typeFilter

      const matchesAmount = Number(transaction.amount || 0) >= minAmount

      return matchesSearch && matchesType && matchesAmount
    })
  }, [walletData.transactions, searchTerm, typeFilter, minimumAmount])

  if (loading) {
    return (
      <LoadingPage
        title="Loading GLA coin wallet"
        message="Fetching wallet balance and transaction history from the system."
      />
    )
  }

  return (
    <div style={styles.panel}>
      <SectionHeader
        eyebrow="GLA coin wallet"
        title="Track your learning currency."
      >
        GLA coin is earned from scores and spent on hints. This screen connects
        to the system using the glaCoinTransactions collection.
      </SectionHeader>

      {onBackToDashboard && (
        <div style={{ ...styles.centerButtonRow, marginTop: 16 }}>
          <button type="button" onClick={onBackToDashboard} style={secondaryButtonStyle}>
            Back to Dashboard
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            ...styles.smallCard,
            marginTop: 18,
            borderColor: 'rgba(153, 27, 27, 0.28)'
          }}
        >
          <p style={{ ...styles.smallCardText, color: '#991b1b' }}>{error}</p>
        </div>
      )}

      <div style={styles.metricGrid}>
        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Current Balance</p>
          <h3 style={styles.smallCardTitle}>{walletData.summary.glaCoinBalance}</h3>
          <p style={styles.smallCardText}>Available GLA coin.</p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Total Earned</p>
          <h3 style={styles.smallCardTitle}>{walletData.summary.totalGlaCoinEarned}</h3>
          <p style={styles.smallCardText}>Coin earned from scoring.</p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Total Spent</p>
          <h3 style={styles.smallCardTitle}>{walletData.summary.totalGlaCoinSpent}</h3>
          <p style={styles.smallCardText}>Mostly spent on hints.</p>
        </div>

        <div style={styles.smallCard}>
          <p style={styles.eyebrow}>Transactions</p>
          <h3 style={styles.smallCardTitle}>{walletData.summary.transactionCount}</h3>
          <p style={styles.smallCardText}>Saved wallet records.</p>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>Search and filter</p>
            <h3 style={styles.smallCardTitle}>Find GLA coin transactions</h3>
          </div>

          <Pill>{filteredTransactions.length} results</Pill>
        </div>

        <div style={filterGridStyle}>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search reason, problem, type or date..."
            style={inputStyle}
          />

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            style={inputStyle}
          >
            <option value="all">All transactions</option>
            <option value="earned">Earned only</option>
            <option value="spent">Spent only</option>
          </select>

          <select
            value={minimumAmount}
            onChange={(event) => setMinimumAmount(event.target.value)}
            style={inputStyle}
          >
            <option value="0">Any amount</option>
            <option value="20">20+ GLA coin</option>
            <option value="50">50+ GLA coin</option>
            <option value="75">75+ GLA coin</option>
            <option value="100">100+ GLA coin</option>
          </select>
        </div>
      </div>

      <div style={{ ...styles.smallCard, marginTop: 18 }}>
        <div style={styles.rowBetween}>
          <div>
            <p style={styles.eyebrow}>the system glaCoinTransactions collection</p>
            <h3 style={styles.smallCardTitle}>Coin history</h3>
          </div>

          <Pill>{loading ? 'Loading...' : `${filteredTransactions.length} rows`}</Pill>
        </div>

        {loading ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            Loading GLA coin transactions from the system...
          </p>
        ) : filteredTransactions.length === 0 ? (
          <p style={{ ...styles.smallCardText, marginTop: 16 }}>
            No GLA coin transactions match your search.
          </p>
        ) : (
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Balance After</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Problem</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.transactionId}>
                    <td style={tdStyle}>
                      <Pill tone={transaction.type === 'earned' ? 'success' : 'default'}>
                        {transaction.type === 'earned' ? 'Earned' : 'Spent'}
                      </Pill>
                    </td>
                    <td style={tdStyle}>
                      {transaction.type === 'spent' ? '-' : '+'}
                      {transaction.amount}
                    </td>
                    <td style={tdStyle}>{transaction.balanceAfter}</td>
                    <td style={tdStyle}>{transaction.reason}</td>
                    <td style={tdStyle}>{transaction.problemTitle || 'General'}</td>
                    <td style={tdStyle}>{transaction.createdAtText}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const filterGridStyle = {
  marginTop: 16,
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 1fr) 190px 190px',
  gap: 12
}

const inputStyle = {
  width: '100%',
  padding: '13px 15px',
  borderRadius: 16,
  border: '1px solid rgba(139, 92, 40, 0.24)',
  background: 'rgba(255, 255, 255, 0.76)',
  color: '#3b2817',
  outline: 'none'
}

const secondaryButtonStyle = {
  border: '1px solid rgba(139, 92, 40, 0.22)',
  borderRadius: 999,
  padding: '11px 16px',
  cursor: 'pointer',
  background: 'rgba(255, 255, 255, 0.72)',
  color: '#5c3512',
  fontWeight: 850
}

const tableWrapStyle = {
  marginTop: 16,
  width: '100%',
  overflowX: 'auto'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 900
}

const thStyle = {
  padding: '12px 14px',
  textAlign: 'left',
  color: '#5c3512',
  fontSize: '0.78rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(139, 92, 40, 0.2)',
  background: 'rgba(244, 210, 138, 0.22)'
}

const tdStyle = {
  padding: '14px',
  color: '#3b2817',
  borderBottom: '1px solid rgba(139, 92, 40, 0.14)',
  verticalAlign: 'top'
}

export default CoinHistoryScreen