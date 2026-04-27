import { useEffect } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'

type BusinessPlaceholderPageProps = {
  title: string
  eyebrow: string
  description: string
}

const getBusinessPageFocus = (title: string) => {
  switch (title) {
    case 'Knowledge':
      return {
        headline: 'Business source of truth',
        details: ['Client memory', 'Offer and proposal shelf', 'Proof-of-value notes'],
      }
    case 'Workflows':
      return {
        headline: 'Repeatable owner loops',
        details: ['Proposal follow-through', 'Renewal rhythm', 'Relationship touchpoints'],
      }
    case 'Operations':
      return {
        headline: 'Delivery and promises',
        details: ['Active commitments', 'Owner bottlenecks', 'Client-ready handoffs'],
      }
    case 'Economy':
      return {
        headline: 'Cash and margin control',
        details: ['Invoice timing', 'Pipeline quality', 'Monthly close signals'],
      }
    case 'Community':
      return {
        headline: 'Relationship pulse',
        details: ['Clients', 'Partners', 'Referrals and personal network'],
      }
    case 'Studio':
      return {
        headline: 'Sales and publishing assets',
        details: ['Proposals', 'Case studies', 'Offer pages and decks'],
      }
    case 'Integrations':
      return {
        headline: 'Business system health',
        details: ['Inbox and calendar', 'CRM and docs', 'Finance tools and automations'],
      }
    default:
      return {
        headline: 'Business operating surface',
        details: ['Owner context', 'Next actions', 'Operational memory'],
      }
  }
}

export const BusinessPlaceholderPage = ({
  title,
  eyebrow,
  description,
}: BusinessPlaceholderPageProps) => {
  const { businessSnapshot, setViewContext } = useCortex()
  const focus = getBusinessPageFocus(title)

  useEffect(() => {
    setViewContext({
      details: {
        placeholder: false,
        businessPage: title,
        businessSections: businessSnapshot?.sections.length ?? 0,
      },
    })
  }, [businessSnapshot?.sections.length, setViewContext, title])

  return (
    <div className="mission-os-grid">
      <Panel title={title} eyebrow={eyebrow} className="minimal-panel">
        <div className="record-grid">
          <article className="record-card accent-cyan">
            <div className="record-card-head">
              <span className="status-badge status-active">business mode</span>
              <span className="record-card-meta">owner cockpit</span>
            </div>
            <h3>{focus.headline}</h3>
            <p>{description}</p>
            <div className="chip-row compact">
              {focus.details.map((detail) => (
                <span key={detail} className="data-chip">
                  {detail}
                </span>
              ))}
            </div>
          </article>

          {(businessSnapshot?.metrics ?? []).map((metric) => (
            <article key={metric.id} className={`metric-card accent-${metric.accent}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Active Business Queue" eyebrow="Least-human-work follow-through" className="minimal-panel">
        <div className="stack-list">
          {(businessSnapshot?.queue ?? []).map((item) => (
            <article key={item.id} className={`list-row accent-${item.accent}`}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.nextAction}</span>
              </div>
              <div>
                <strong>{item.status}</strong>
                <span>{item.owner}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Business Workspace Sections" eyebrow="Existing navigation only" className="minimal-panel">
        <div className="stack-list">
          {(businessSnapshot?.sections ?? []).map((section) => (
            <article key={section.id} className={`list-row accent-${section.accent}`}>
              <div>
                <strong>{section.title}</strong>
                <span>{section.description}</span>
              </div>
              <div>
                <strong>{section.status}</strong>
                <span>{section.route}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
